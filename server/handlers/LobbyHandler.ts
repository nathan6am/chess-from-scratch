import { RedisClient } from "../index";
import { wrapClient } from "../util/redisClientWrapper";
import { Lobby, Game, Player, LobbySocket as Socket, LobbyServer } from "../types/lobby";
import { default as GameEntity } from "../../lib/db/entities/Game";
import { Server } from "../types/socket";
import * as Chess from "../../lib/chess";
import { currentISO, currentTimeRemaining, switchClock } from "../util/clockFunctions";
import { DateTime } from "luxon";
import { notEmpty } from "../../util/misc";
import User from "../../lib/db/entities/User";
import { gameFromNodeData } from "../../lib/chess";
import e from "express";

export default function LobbyHandler(
  io: Server,
  nsp: LobbyServer,
  socket: Socket,
  redisClient: RedisClient
): void {
  const cache = wrapClient(redisClient);

  //UTILITY FUNCTIONS
  //Retrieve a socket instance by its id
  const socketInstanceById = async (socketId: string) => {
    const sockets = await nsp.in(socketId).fetchSockets();
    for (const socket of sockets) {
      if (socket.id === socketId) return socket as unknown as Socket;
    }
  };

  //Retrieve the socket instance for the next player to move in a lobby
  const getNextPlayerSocket = async (lobbyid: string): Promise<Socket | undefined> => {
    const currentLobby = await cache.getLobbyById(lobbyid);
    if (!currentLobby) return;
    if (!currentLobby.currentGame) return;
    const nextPlayerId =
      currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor];
    const nextPlayerSocketId = currentLobby.players.find(
      (player) => player.id === nextPlayerId
    )?.primaryClientSocketId;
    if (!nextPlayerSocketId) return;
    const nextPlayerSocket = await socketInstanceById(nextPlayerSocketId);
    return nextPlayerSocket;
  };

  //Start a game in a given lobby
  async function startGame(lobbyid: string) {
    const lobby = await cache.getLobbyById(lobbyid);
    if (!lobby) throw new Error("Lobby does not exist");

    const game = await cache.newGame(lobbyid);
    if (!game) throw new Error("Unable to start game");

    const playerW = game.players.w;
    const playerWhiteSocketId = lobby.players.find(
      (player) => player.id === playerW
    )?.primaryClientSocketId;
    if (!playerWhiteSocketId) throw new Error("Conection mismatch");
    const whiteSocket = await socketInstanceById(playerWhiteSocketId);
    //Abort the game if the player is not connected
    if (!whiteSocket) {
      return;
    }
    requestMoveWithTimeout(whiteSocket, game.clock.timeRemainingMs.w, game, lobbyid);
    nsp.to(lobbyid).emit("game:new", game);
  }

  //Handle game result
  async function handleGameResult(lobbyid: string, game: Game) {
    const lobby = await cache.getLobbyById(lobbyid);
    if (!lobby || !lobby.currentGame) return;

    const updated = await cache.updateGame(lobbyid, game);
    const playerW = lobby.players.find((player) => player.id === game.players.w);
    const playerB = lobby.players.find((player) => player.id === game.players.b);
    if (!playerW || !playerB) throw new Error("player mismatch");
    const players = { w: playerW, b: playerB };
    console.log(players);
    const outcome = updated.data.outcome;
    if (!outcome) return;
    //update game scores
    if (outcome.result === "d") {
      lobby.players = lobby.players.map((player) => {
        return { ...player, score: player.score + 0.5 };
      });
    } else {
      lobby.players = lobby.players.map((player) => {
        if (outcome.result === "w" && player.id === playerW.id) {
          return {
            ...player,
            score: player.score + 1,
          };
        } else if (outcome.result === "b" && player.id === playerB.id) {
          return {
            ...player,
            score: player.score + 1,
          };
        } else return player;
      });
    }
    await cache.updateLobby(lobbyid, { players: lobby.players });
    const data = updated.data;
    const timeControl = updated.data.config.timeControls && updated.data.config.timeControls[0];
    nsp.to(lobbyid).emit("game:outcome", updated);
    nsp.to(lobbyid).emit("lobby:update", { players: lobby.players });
    //Save the game to db if any user is not a guest
    if (lobby.players.some((player) => player.user.type !== "guest")) {
      console.log(game.id);
      const saved = await GameEntity.saveGame(players, outcome, data, timeControl, game.id);
      console.log(saved);
    }
  }

  socket.on("disconnect", () => {
    //Find the active game if applicable and set a timeout for reconnection
    //or, abort the game if it has not yet started
    console.log(`Client ${socket.data.userid} has disconnected`);
  });

  socket.on("lobby:connect", async (lobbyid, ack) => {
    try {
      //Verify the user is authenticated and the lobby exists in the cache
      const sessionUser = socket.data.sessionUser;
      if (!sessionUser) throw new Error("Unauthenticated");
      const { id, username, type } = sessionUser;
      const lobby = await cache.getLobbyById(lobbyid);
      if (!lobby) throw new Error("Lobby does not exist");

      //Verify the user has permission to join the lobby or a free slot is available
      if (
        lobby.reservedConnections.includes(id) ||
        (lobby.reservedConnections.length < 2 && lobby.players.length < 2)
      ) {
        let player: Player;
        if (type !== "guest") {
          //Get the user's current rating if the user is not a guest
          const user = await User.findOneBy({ id });
          if (!user) throw new Error("Unauthenticated");
          console.log(user);
          player = {
            id,
            username: username || "",
            rating: user.rating,
            score: 0,
            primaryClientSocketId: socket.id,
            user: sessionUser,
          };
        } else {
          player = {
            id,
            username: sessionUser.username || "",
            score: 0,
            primaryClientSocketId: socket.id,
            user: sessionUser,
          };
        }
        //Check if the player was already connected from a previous client and notify any concurrent
        //clients of the same user
        const previousClient = lobby.players.find((existingPlayer) => existingPlayer.id === id);
        if (previousClient) {
          const clientToRemove = previousClient.primaryClientSocketId;
          const clients = lobby.players
            .map((player) => player.primaryClientSocketId)
            .filter((socketId) => socketId !== clientToRemove);
          clients.push(socket.id);
          const inLobby = await nsp.in(lobbyid).fetchSockets();
          inLobby.forEach((socket) => {
            if (!clients.includes(socket.id)) {
              socket.leave(lobbyid);
            }
          });
          socket.join(lobbyid);
          nsp.to(id).except(socket.id).emit("newclient");
        }

        //Update the cached lobby and add the socket to the room
        const updated = await cache.connectToLobby(lobbyid, player);
        socket.join(lobbyid);

        if (updated.currentGame) {
          if (updated.currentGame.data.outcome) {
            ack({ status: true, data: updated, error: null });
          } else {
            const game = updated.currentGame;
            const activeColor = game.data.activeColor;
            const clock = game.clock;
            //Correct the time remaining if both player have played a move
            if (
              game.data.moveHistory.flat().filter(notEmpty).length > 2 &&
              clock.lastMoveTimeISO !== null
            ) {
              clock.timeRemainingMs[activeColor] = currentTimeRemaining(
                clock.lastMoveTimeISO,
                clock.timeRemainingMs[activeColor]
              );
              if (game.players[activeColor] !== id) {
                //Ack if the connected player is not the current turn
                nsp.to(lobbyid).emit("lobby:update", {
                  players: updated.players,
                  reservedConnections: updated.reservedConnections,
                });
                ack({ status: true, data: updated, error: null });
                return;
              } else {
                //Request move
              }
            }
          }
        }

        //Return the lobby to the client and start the game if both players are connected and
        ack({ status: true, data: updated, error: null });
        nsp.to(lobbyid).emit("lobby:update", {
          players: updated.players,
          reservedConnections: updated.reservedConnections,
        });
        if (updated.players.length === 2 && lobby.currentGame === null) startGame(lobbyid);
        return;
      }
      ack({ status: false, error: new Error("Lobby is full") });
    } catch (err: unknown) {
      //Log any errors and pass them in the response to the client
      console.error(err);
      if (err instanceof Error) {
        ack({ status: false, error: err });
      } else {
        ack({ status: false, error: new Error("Unable to connect to lobby") });
      }
    }
  });

  const requestMoveWithTimeout = async (
    socket: Socket,
    timeoutMs: number,
    game: Game,
    lobbyid: string
  ) => {
    const lobby = await cache.getLobbyById(lobbyid);
    if (!lobby) throw new Error("lobby does not exist");
    if (!lobby.currentGame || lobby.currentGame.id !== game.id) throw new Error("game not found");
    //Correct the time remaining before emitting
    const clock = lobby.currentGame.clock;
    if (clock.lastMoveTimeISO) {
      lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor] =
        currentTimeRemaining(
          clock.lastMoveTimeISO,
          clock.timeRemainingMs[lobby.currentGame.data.activeColor]
        );
    }
    //Timeout event to end the game if the user hasn't played a move in the allotted time
    socket
      .timeout(timeoutMs)
      .emit("game:request-move", timeoutMs, lobby.currentGame, async (err, response) => {
        if (err) {
          const lobby = await cache.getLobbyById(lobbyid);
          if (!lobby) return;
          if (!lobby.currentGame) return;
          //return if the game has an outcome or a new game has started
          if (lobby.currentGame?.id !== game.id || lobby.currentGame.data.outcome) return;
          //return if moves have been played since the initial request
          if (
            lobby.currentGame.data.moveHistory.flat().length !== game.data.moveHistory.flat().length
          )
            return;
          //Set outcome by timeout and emit
          //TODO: Check for insufficient material
          lobby.currentGame.data.outcome = {
            result: lobby.currentGame.data.activeColor === "w" ? "b" : "w",
            by: "timeout",
          };
          lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor] = 0;
          await cache.updateGame(lobbyid, lobby.currentGame);
          await handleGameResult(lobbyid, lobby.currentGame);
        } else {
          //Attempt to execute the move upon response from the client
          try {
            const updated = await executeMove(response, lobbyid);
            nsp.to(lobbyid).emit("game:move", updated);
            if (updated.data.outcome) {
              await handleGameResult(lobbyid, updated);
              return;
            }
            const currentLobby = await cache.getLobbyById(lobbyid);

            //Retrieve the socket instance for the next player
            if (!currentLobby) return;
            if (!currentLobby.currentGame) return;
            const nextPlayerId =
              currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor];
            const nextPlayerSocketId = currentLobby.players.find(
              (player) => player.id === nextPlayerId
            )?.primaryClientSocketId;
            if (!nextPlayerSocketId) return;
            const nextPlayerSocket = await socketInstanceById(nextPlayerSocketId);
            //TODO: set abandonment timeout
            if (!nextPlayerSocket) return;
            const timeRemainingMs = currentTimeRemaining(
              currentLobby.currentGame.clock.lastMoveTimeISO || DateTime.now().toISO(),
              currentLobby.currentGame.clock.timeRemainingMs[
                currentLobby.currentGame.data.activeColor
              ]
            );
            //Request move from next player
            requestMoveWithTimeout(
              nextPlayerSocket,
              timeRemainingMs,
              currentLobby.currentGame,
              lobbyid
            );
          } catch (e) {
            const lobby = await cache.getLobbyById(lobbyid);
            if (!lobby) return;
            if (!lobby.currentGame) return;
            //return if the game has an outcome or a new game has started
            if (lobby.currentGame?.id !== game.id || lobby.currentGame.data.outcome) return;
            //return if moves have been played since the initial request
            if (
              lobby.currentGame.data.moveHistory.flat().length !==
              game.data.moveHistory.flat().length
            )
              return;
            const timeRemainingMs = currentTimeRemaining(
              lobby.currentGame.clock.lastMoveTimeISO || DateTime.now().toISO(),
              lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor]
            );
            //Rerequest with new timeout
            requestMoveWithTimeout(socket, timeRemainingMs, game, lobbyid);
          }
        }
      });
  };

  //Execute a move and updated the cached game state
  async function executeMove(move: Chess.Move, lobbyid: string) {
    const moveRecievedISO = currentISO();

    //Verify the lobby anf game still exist
    const lobby = await cache.getLobbyById(lobbyid);
    if (!lobby) throw new Error("Lobby does not exist");
    const game = lobby.currentGame;
    if (game === null) throw new Error("no active game");
    if (!lobby.reservedConnections.some((id) => id === socket.data.userid))
      throw new Error("Player is not in lobby");

    //Execute the move
    const updatedGameData = Chess.move(game.data, move);

    //Update the clocks if both players have played a move
    if (updatedGameData.fullMoveCount >= 2) {
      //Update the clock state and apply increment
      const updatedClock = switchClock(game.clock, moveRecievedISO, game.data.activeColor);
      return await cache.updateGame(lobbyid, {
        ...game,
        data: updatedGameData,
        clock: updatedClock,
      });
    } else {
      return await cache.updateGame(lobbyid, {
        ...game,
        data: updatedGameData,
      });
    }
  }

  socket.on("game:move", async ({ move, lobbyid }, ack) => {
    const updated = await executeMove(move, lobbyid);
    //Return the updated game data to the client and emit to the opponent
    ack({ status: true, data: updated, error: null });
    socket.to(lobbyid).emit("game:move", updated);

    const currentLobby = await cache.getLobbyById(lobbyid);
    if (!currentLobby || !currentLobby.currentGame) return;
    const nextPlayerSocket = await getNextPlayerSocket(lobbyid);

    //TODO: timeout abandonment handler
    if (!nextPlayerSocket) return;

    //Get the current remaining time
    const timeRemainingMs = currentTimeRemaining(
      currentLobby.currentGame.clock.lastMoveTimeISO || DateTime.now().toISO(),
      currentLobby.currentGame.clock.timeRemainingMs[currentLobby.currentGame.data.activeColor]
    );
    //Request move from next player
    requestMoveWithTimeout(nextPlayerSocket, timeRemainingMs, currentLobby.currentGame, lobbyid);
  });

  socket.on("game:resign", async (lobbyid) => {
    const user = socket.data.sessionUser;
    const lobby = await cache.getLobbyById(lobbyid);
    if (!lobby || !lobby.currentGame || lobby.currentGame.data.outcome || !user) return;
    if (!lobby.players.some((player) => player.id === user.id)) return;
    const playerColor = lobby.currentGame.players.w === user.id ? "w" : "b";
    const game = lobby.currentGame;
    game.data.outcome = { result: playerColor === "w" ? "b" : "w", by: "resignation" };
    const updated = await cache.updateGame(lobbyid, game);
    await handleGameResult(lobbyid, game);
  });
}

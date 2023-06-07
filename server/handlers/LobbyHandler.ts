import { RedisClient } from "../index";
import { wrapClient } from "../util/redisClientWrapper";
import { Lobby, Game, Player, Connection, LobbySocket as Socket, LobbyServer } from "../types/lobby";
import { default as GameEntity } from "../../lib/db/entities/Game";
import { Server } from "../types/socket";
import * as Chess from "../../lib/chess";
import { currentISO, currentTimeRemaining, switchClock } from "../util/clockFunctions";
import { DateTime } from "luxon";
import { notEmpty } from "../../util/misc";
import User from "../../lib/db/entities/User";
import { updateRatings } from "../util/glicko";
import { encodeGameToPgn } from "../../util/parsers/pgnParser";

export default function LobbyHandler(io: Server, nsp: LobbyServer, socket: Socket, redisClient: RedisClient): void {
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
    const nextPlayer = currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor];
    const nextPlayerConnection = currentLobby.connections.find((player) => player.id === nextPlayer.id);
    if (!nextPlayerConnection) return;
    const nextPlayerSocketId = nextPlayerConnection.lastClientSocketId;
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
    const playerWhiteConnection = lobby.connections.find((player) => player.id === playerW.id);
    if (!playerWhiteConnection) throw new Error("Conection mismatch");
    const playerWhiteSocketId = playerWhiteConnection.lastClientSocketId;
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
    const connectionWhite = lobby.connections.find((connection) => connection.id === game.players.w.id);
    const connectionBlack = lobby.connections.find((connection) => connection.id === game.players.b.id);
    if (!connectionBlack || !connectionWhite) throw new Error("connections mismatched");
    const connections = { w: connectionWhite, b: connectionBlack };
    const outcome = updated.data.outcome;
    if (!outcome) return;
    //update game scores
    if (outcome.result === "d") {
      lobby.connections = lobby.connections.map((connection) => {
        return { ...connection, score: connection.score + 0.5 };
      });
    } else {
      lobby.connections = lobby.connections.map((connection) => {
        if (outcome.result === "w" && connection.id === connectionWhite.id) {
          return {
            ...connection,
            score: connection.score + 1,
          };
        } else if (outcome.result === "b" && connection.id === connectionBlack.id) {
          return {
            ...connection,
            score: connection.score + 1,
          };
        } else return connection;
      });
    }
    let ratingDeltas = { w: 0, b: 0 };
    //update user ratings if applicable
    if (lobby.connections.every((connection) => connection.player.type !== "guest") && lobby.options.rated) {
      const playerw = await User.findOneBy({ id: connectionWhite.player.id });
      const playerb = await User.findOneBy({ id: connectionBlack.player.id });
      if (!playerw || !playerb) throw new Error("User not found");
      const ratingCategory = Chess.inferRatingCategeory(lobby.options.gameConfig.timeControl || null);
      const ratingw = playerw.ratings[ratingCategory];
      const ratingb = playerb.ratings[ratingCategory];
      const result = outcome.result === "w" ? 1 : outcome.result === "b" ? 0 : 0.5;
      const [newRatingW, newRatingB] = updateRatings(ratingw, ratingb, result);
      await User.updateRatings(ratingCategory, [
        { id: playerw.id, newRating: newRatingW },
        { id: playerb.id, newRating: newRatingB },
      ]);
      ratingDeltas = {
        w: newRatingW.rating - ratingw.rating,
        b: newRatingB.rating - ratingb.rating,
      };
      //Update the connection objects with the new ratings
      lobby.connections = lobby.connections.map((connection) => {
        if (connection.id === connectionWhite.id) {
          return {
            ...connection,
            player: {
              ...connection.player,
              rating: newRatingW.rating,
            },
          };
        } else if (connection.id === connectionBlack.id) {
          return {
            ...connection,
            player: {
              ...connection.player,
              rating: newRatingB.rating,
            },
          };
        }
        return connection;
      });
    }

    await cache.updateLobby(lobbyid, { connections: lobby.connections });
    const data = updated.data;
    const timeControl = updated.data.config.timeControl || null;
    const players = {
      w: connections.w.player,
      b: connections.b.player,
    };
    nsp.to(lobbyid).emit("game:outcome", updated);
    nsp.to(lobbyid).emit("lobby:update", { connections: lobby.connections });
    //Save the game to db if any user is not a guest
    if (lobby.connections.some((connection) => connection.player.type !== "guest")) {
      //console.log(game.id);
      const pgn = encodeGameToPgn(updated);
      const saved = await GameEntity.saveGame(players, outcome, data, timeControl, pgn, game.id);
      //console.log(saved);
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
        (lobby.reservedConnections.length < 2 && lobby.connections.length < 2)
      ) {
        let connection: Connection;
        if (type !== "guest") {
          //Get the user's current rating if the user is not a guest
          const user = await User.findById(id);
          //console.log(id);
          if (!user) throw new Error("Unauthenticated");
          const timeControl = lobby.options.gameConfig.timeControl;
          const ratingCategory = Chess.inferRatingCategeory(timeControl || null);

          //console.log(user);
          connection = {
            id,
            player: {
              ...sessionUser,
              rating: user.ratings[ratingCategory].rating,
            },
            score: 0,
            lastClientSocketId: socket.id,
            connectionStatus: true,
          };
        } else {
          connection = {
            id,
            player: sessionUser,
            score: 0,
            lastClientSocketId: socket.id,
            connectionStatus: true,
          };
        }
        //Check if the player was already connected from a previous client and notify any concurrent
        //clients of the same user
        const previousClient = lobby.connections.find((existingConn) => existingConn.id === id);
        if (previousClient) {
          const clientToRemove = previousClient.lastClientSocketId;
          const clients = lobby.connections
            .map((conn) => conn.lastClientSocketId)
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
        const updated = await cache.connectToLobby(lobbyid, connection);
        socket.join(lobbyid);

        if (updated.currentGame) {
          if (updated.currentGame.data.outcome) {
            ack({ status: true, data: updated, error: null });
          } else {
            const game = updated.currentGame;
            const activeColor = game.data.activeColor;
            const clock = game.clock;
            //Correct the time remaining if both player have played a move
            if (game.data.moveHistory.flat().filter(notEmpty).length > 2 && clock.lastMoveTimeISO !== null) {
              clock.timeRemainingMs[activeColor] = currentTimeRemaining(
                clock.lastMoveTimeISO,
                clock.timeRemainingMs[activeColor]
              );
              if (game.players[activeColor].id !== id) {
                //Ack if the connected player is not the current turn
                nsp.to(lobbyid).emit("lobby:update", {
                  connections: updated.connections,
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
          connections: updated.connections,
          reservedConnections: updated.reservedConnections,
        });
        if (updated.connections.length === 2 && lobby.currentGame === null) startGame(lobbyid);
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

  const requestMoveWithTimeout = async (socket: Socket, timeoutMs: number, game: Game, lobbyid: string) => {
    const lobby = await cache.getLobbyById(lobbyid);
    if (!lobby) throw new Error("lobby does not exist");
    if (!lobby.currentGame || lobby.currentGame.id !== game.id) throw new Error("game not found");
    //Correct the time remaining before emitting
    const clock = lobby.currentGame.clock;
    if (clock.lastMoveTimeISO) {
      lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor] = currentTimeRemaining(
        clock.lastMoveTimeISO,
        clock.timeRemainingMs[lobby.currentGame.data.activeColor]
      );
    }
    //Timeout event to end the game if the user hasn't played a move in the allotted time
    socket.timeout(timeoutMs).emit("game:request-move", timeoutMs, lobby.currentGame, async (err, response) => {
      if (err) {
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby) return;
        if (!lobby.currentGame) return;
        //return if the game has an outcome or a new game has started
        if (lobby.currentGame?.id !== game.id || lobby.currentGame.data.outcome) return;
        //return if moves have been played since the initial request
        if (lobby.currentGame.data.moveHistory.flat().length !== game.data.moveHistory.flat().length) return;
        //Set outcome by timeout and emit
        const board = lobby.currentGame.data.board;
        const pieces: Record<Chess.Color, Chess.Piece[]> = {
          w: board.filter(([square, piece]) => piece.color === "w").map(([square, piece]) => piece),
          b: board.filter(([square, piece]) => piece.color === "b").map(([square, piece]) => piece),
        };
        const nextColor = lobby.currentGame.data.activeColor === "w" ? "b" : "w";
        if (Chess.isSufficientMaterial(pieces[nextColor])) {
          lobby.currentGame.data.outcome = {
            result: nextColor,
            by: "timeout",
          };
        } else {
          lobby.currentGame.data.outcome = {
            result: "d",
            by: "timeout-w-insufficient",
          };
        }

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
          const nextPlayerId = currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor].id;
          const nextPlayerConnection = currentLobby.connections.find((player) => player.id === nextPlayerId);
          if (!nextPlayerConnection) return;
          const nextPlayerSocketId = nextPlayerConnection.lastClientSocketId;
          const nextPlayerSocket = await socketInstanceById(nextPlayerSocketId);
          //TODO: set abandonment timeout
          if (!nextPlayerSocket) return;
          const timeRemainingMs = currentTimeRemaining(
            currentLobby.currentGame.clock.lastMoveTimeISO || DateTime.now().toISO(),
            currentLobby.currentGame.clock.timeRemainingMs[currentLobby.currentGame.data.activeColor]
          );
          //Request move from next player
          requestMoveWithTimeout(nextPlayerSocket, timeRemainingMs, currentLobby.currentGame, lobbyid);
        } catch (e) {
          const lobby = await cache.getLobbyById(lobbyid);
          if (!lobby) return;
          if (!lobby.currentGame) return;
          //return if the game has an outcome or a new game has started
          if (lobby.currentGame?.id !== game.id || lobby.currentGame.data.outcome) return;
          //return if moves have been played since the initial request
          if (lobby.currentGame.data.moveHistory.flat().length !== game.data.moveHistory.flat().length) return;
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
    if (!lobby.reservedConnections.some((id) => id === socket.data.userid)) throw new Error("Player is not in lobby");

    //Execute the move
    const updatedClock = switchClock(game.clock, moveRecievedISO, game.data.activeColor);
    const updatedGameData = Chess.move(game.data, move, updatedClock.timeRemainingMs[game.data.activeColor]);

    //Update the clocks if both players have played a move
    if (updatedGameData.fullMoveCount >= 2) {
      //Update the clock state and apply increment

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
    if (!lobby.connections.some((player) => player.id === user.id)) return;
    const playerColor = lobby.currentGame.players.w.id === user.id ? "w" : "b";
    const game = lobby.currentGame;
    game.data.outcome = { result: playerColor === "w" ? "b" : "w", by: "resignation" };
    const updated = await cache.updateGame(lobbyid, game);
    await handleGameResult(lobbyid, game);
  });
}

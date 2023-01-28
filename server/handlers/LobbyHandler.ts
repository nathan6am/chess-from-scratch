import { nanoid } from "nanoid";
import { RedisClient } from "../index";
import { wrapClient } from "../util/redisClientWrapper";
import {
  Lobby,
  Game,
  Player,
  LobbySocket as Socket,
  LobbyServer,
} from "../types/lobby";
import { Server } from "../types/socket";
import * as Chess from "../../lib/chess";
import {
  currentISO,
  currentTimeRemaining,
  switchClock,
} from "../util/clockFunctions";
import { DateTime } from "luxon";
import { notEmpty } from "../../util/misc";
import { get } from "react-hook-form";
export default function LobbyHandler(
  io: Server,
  nsp: LobbyServer,
  socket: Socket,
  redisClient: RedisClient
): void {
  const cache = wrapClient(redisClient);

  socket.on("disconnect", () => {
    //Find the active game if applicable and set a timeout for reconnection
    //or, abort the game if it has not yet started
    console.log(`Client ${socket.data.userid} has disconnected`);
  });

  socket.on("test:timeout", async () => {
    console.log("testing");
    socket.timeout(10000).emit("test:requestAck", "hello", (err, arg) => {
      if (err) {
        console.log(err);
      } else {
        console.log(arg);
      }
    });
  });

  /*
   *  Connects a player to a lobby, and starts the game if both players are
   *  connected
   * */
  socket.on("lobby:connect", async (lobbyid, ack) => {
    try {
      //Verify the user is authenticated and the lobby exists in the cache
      const userid = socket.data.userid;
      if (!userid) throw new Error("Unauthenticated");
      const lobby = await cache.getLobbyById(lobbyid);
      if (!lobby) throw new Error("Lobby does not exist");

      if (
        lobby.reservedConnections.includes(userid) ||
        (lobby.reservedConnections.length < 2 && lobby.players.length < 2)
      ) {
        const player: Player = {
          id: userid,
          score: 0,
          primaryClientSocketId: socket.id,
        };

        //Check if the player was already connected from a previous client and notify any concurrent
        //clients of the same user
        const previousClient = lobby.players.find(
          (existingPlayer) => existingPlayer.id === userid
        );
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
          nsp.to(userid).except(socket.id).emit("newclient");
        }

        //Update the cached lobby and add the socket to the room
        const updated = await cache.connectToLobby(lobbyid, player);
        socket.join(lobbyid);

        if (updated.currentGame) {
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
            if (game.players[activeColor] !== userid) {
              //Ack if the connected player is not the current turn
              ack({ status: true, data: updated, error: null });
              return;
            } else {
              //Request move
            }
          }
        }

        //Return the lobby to the client and start the game if both players are connected and
        ack({ status: true, data: updated, error: null });
        if (updated.players.length === 2 && lobby.currentGame === null) {
          console.log("starting");
          startGame(lobbyid);
        }
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

  const socketInstanceById = async (socketId: string) => {
    const sockets = await nsp.in(socketId).fetchSockets();
    for (const socket of sockets) {
      if (socket.id === socketId) return socket as unknown as Socket;
    }
  };
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

    if (!whiteSocket) {
      //Abort the game
      return;
    }
    requestMoveWithTimeout(
      whiteSocket,
      game.clock.timeRemainingMs.w,
      game,
      lobbyid
    );
    nsp.to(lobbyid).emit("game:new", game);
  }

  const requestMoveWithTimeout = async (
    socket: Socket,
    timeoutMs: number,
    game: Game,
    lobbyid: string
  ) => {
    const now = DateTime.now();
    const lobby = await cache.getLobbyById(lobbyid);
    if (!lobby) throw new Error("lobby does not exist");
    if (!lobby.currentGame || lobby.currentGame.id !== game.id)
      throw new Error("game not found");
    //Correct the time remaining before emitting
    if (lobby.currentGame.clock.lastMoveTimeISO) {
      lobby.currentGame.clock.timeRemainingMs[
        lobby.currentGame.data.activeColor
      ] = currentTimeRemaining(
        lobby.currentGame.clock.lastMoveTimeISO,
        lobby.currentGame.clock.timeRemainingMs[
          lobby.currentGame.data.activeColor
        ]
      );
    }
    socket
      .timeout(timeoutMs)
      .emit(
        "game:request-move",
        timeoutMs,
        lobby.currentGame,
        async (err, response) => {
          if (err) {
            const lobby = await cache.getLobbyById(lobbyid);
            if (!lobby) return;
            if (!lobby.currentGame) return;
            //return if the game has an outcome or a new game has started
            if (
              lobby.currentGame?.id !== game.id ||
              lobby.currentGame.data.outcome
            )
              return;
            //return if moves have been played since the initial request
            if (
              lobby.currentGame.data.moveHistory.flat().length !==
              game.data.moveHistory.flat().length
            )
              return;
            //Set outcome by timeout and emit
            lobby.currentGame.data.outcome = {
              result: lobby.currentGame.data.activeColor === "w" ? "b" : "w",
              by: "timeout",
            };
            lobby.currentGame.clock.timeRemainingMs[
              lobby.currentGame.data.activeColor
            ] = 0;
            cache.updateGame(lobbyid, lobby.currentGame);
            nsp.to(lobbyid).emit("game:outcome", lobby.currentGame);
          } else {
            try {
              console.log(response);
              const updated = await executeMove(response, lobbyid);
              nsp.to(lobbyid).emit("game:move", updated);
              const currentLobby = await cache.getLobbyById(lobbyid);
              if (!currentLobby) return;
              if (!currentLobby.currentGame) return;
              const nextPlayerId =
                currentLobby.currentGame.players[
                  currentLobby.currentGame.data.activeColor
                ];
              const nextPlayerSocketId = currentLobby.players.find(
                (player) => player.id === nextPlayerId
              )?.primaryClientSocketId;
              if (!nextPlayerSocketId) return;
              const nextPlayerSocket = await socketInstanceById(
                nextPlayerSocketId
              );
              if (!nextPlayerSocket) return;
              const timeRemainingMs = currentTimeRemaining(
                currentLobby.currentGame.clock.lastMoveTimeISO ||
                  DateTime.now().toISO(),
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
              if (
                lobby.currentGame?.id !== game.id ||
                lobby.currentGame.data.outcome
              )
                return;
              //return if moves have been played since the initial request
              if (
                lobby.currentGame.data.moveHistory.flat().length !==
                game.data.moveHistory.flat().length
              )
                return;
              const timeRemainingMs = currentTimeRemaining(
                lobby.currentGame.clock.lastMoveTimeISO ||
                  DateTime.now().toISO(),
                lobby.currentGame.clock.timeRemainingMs[
                  lobby.currentGame.data.activeColor
                ]
              );
              //Rerequest with new timeout
              requestMoveWithTimeout(socket, timeRemainingMs, game, lobbyid);
            }
          }
        }
      );
  };

  async function executeMove(move: Chess.Move, lobbyid: string) {
    const moveRecievedISO = currentISO();
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
      const updatedClock = switchClock(
        game.clock,
        moveRecievedISO,
        game.data.activeColor
      );
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
    if (!currentLobby) return;
    if (!currentLobby.currentGame) return;
    const nextPlayerId =
      currentLobby.currentGame.players[
        currentLobby.currentGame.data.activeColor
      ];
    const nextPlayerSocketId = currentLobby.players.find(
      (player) => player.id === nextPlayerId
    )?.primaryClientSocketId;
    if (!nextPlayerSocketId) return;
    const nextPlayerSocket = await socketInstanceById(nextPlayerSocketId);
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
  });
}

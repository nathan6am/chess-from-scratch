import { nanoid } from "nanoid";
import { RedisClient } from "../index";
import { wrapClient } from "../util/redisClientWrapper";
import { Lobby, Game, Player, LobbySocket as Socket, LobbyServer } from "../types/lobby";
import { Server } from "../types/socket";
import * as Chess from "../../lib/chess";
import { currentISO, switchClock } from "../util/clockFunctions";
export default function LobbyHandler(io: Server, nsp: LobbyServer, socket: Socket, redisClient: RedisClient): void {
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
        //Add the player to the lobby cache and join the corresponding room
        const player: Player = {
          id: userid,
          score: 0,
          primaryClientSocketId: socket.id,
        };
        const lobby = await cache.connectToLobby(lobbyid, player);
        socket.join(lobbyid);

        //Return the lobby to the client and start the game if both players are connected and
        ack({ status: true, data: lobby, error: null });
        if (lobby.players.length === 2 && lobby.currentGame === null) {
          const game = await cache.newGame(lobbyid);
          nsp.to(lobbyid).emit("game:new", game);
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
    const sockets = await io.in(socketId).fetchSockets();
    for (const socket of sockets) {
      if (socket.id === socketId) return socket;
    }
  };
  async function startGame(lobbyid: string) {
    const lobby = await cache.getLobbyById(lobbyid);
    if (!lobby) throw new Error("Lobby does not exist");

    const game = await cache.newGame(lobbyid);
    if (!game) throw new Error("Unable to start game");

    const playerW = game.players.w;
    const playerWhiteSocketId = lobby.players.find((player) => player.id === playerW)?.primaryClientSocketId;
    if (!playerWhiteSocketId) throw new Error("Conection mismatch");
    nsp
      .to(playerWhiteSocketId)
      .timeout(30000)
      .emit("game:request-move", 30000, (err, response) => {
        if (err) {
          console.error(err);
        } else {
          console.log(response[0]);
          nsp.to(lobbyid).emit;
        }
      });
  }

  socket.on("game:move", async ({ move, lobbyid }, ack) => {
    const moveRecievedISO = currentISO();
    const lobby = await cache.getLobbyById(lobbyid);
    if (!lobby) throw new Error("Lobby does not exist");
    const game = lobby.currentGame;
    if (game === null) throw new Error("no active game");
    if (!lobby.reservedConnections.some((id) => id === socket.data.userid)) throw new Error("Player is not in lobby");

    //Execute the move
    const updatedGameData = Chess.move(game.data, move);

    //Update the clock state and apply increment
    const updatedClock = switchClock(game.clock, moveRecievedISO, game.data.activeColor);
    const updated = await cache.updateGame(lobbyid, {
      ...game,
      data: updatedGameData,
      clock: updatedClock,
    });

    //Return the updated game data to the client and emit to the opponent
    ack({ status: true, data: updated, error: null });
    socket.to(lobbyid).emit("game:move", updated);
  });
}

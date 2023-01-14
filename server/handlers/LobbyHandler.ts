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
import * as Chess from "../../util/chess";
export default function LobbyHandler(
  io: Server,
  nsp: LobbyServer,
  socket: Socket,
  redisClient: RedisClient
): void {
  const cache = wrapClient(redisClient);
  socket.on("lobby:connect", async (lobbyid, ack) => {
    console.log(lobbyid);
    try {
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
        const lobby = await cache.connectToLobby(lobbyid, player);
        socket.join(lobbyid);
        ack({ status: true, data: lobby, error: null });
        return;
      }
      ack({ status: false, error: new Error("Lobby is full") });
    } catch (err: unknown) {
      console.log(err);
      if (err instanceof Error) {
        ack({ status: false, error: err });
      } else {
        ack({ status: false, error: new Error("Unable to connect to lobby") });
      }
    }
  });
}

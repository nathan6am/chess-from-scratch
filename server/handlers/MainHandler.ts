//Types
import { Socket, Server } from "../types/socket";
import { Lobby } from "../types/lobby";

//Redis
import { RedisClient } from "../index";
import { wrapClient } from "../util/redisClientWrapper";

//Utils
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 7);

export default function (io: Server, socket: Socket, redisClient: RedisClient): void {
  const cache = wrapClient(redisClient);
  socket.on("authenticate", async (ack) => {
    if (!socket.data.userid) {
      ack(false);
      return;
    }
    //Leave all rooms
    const rooms = socket.rooms;
    rooms.forEach((room) => {
      if (room && room !== socket.id) socket.leave(room);
    });

    //Join room for all connections of the same user - allows broadcasting events to all sessions
    //for example to disable game if active on another conection
    socket.join(socket.data.userid);
    ack(true);
  });

  socket.on("lobby:create", async (options, ack) => {
    const userid = socket.data.userid;
    if (!userid) {
      console.log("unauthenticated");
      ack({ status: false, error: new Error("Unauthenticated") });
      return;
    }
    const lobby: Lobby = {
      id: nanoid(7),
      creatorId: userid,
      reservedConnections: [userid],
      currentGame: null,
      connections: [], //Add to reserved connections, but not players until user joins the lobby page
      options: {
        rated: false,
        gameConfig: options.gameConfig || {
          startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          timeControl: { timeSeconds: 300, incrementSeconds: 5 },
        },
        color: "random",
        ...options,
      },
      rematchRequested: { w: null, b: null },
      chat: [],
    };
    try {
      const created = await cache.newLobby(lobby);
      ack({ status: true, data: created, error: null });
      return;
    } catch (err: unknown) {
      if (err instanceof Error) {
        ack({ status: false, error: err });
        return;
      } else {
        ack({ status: false, error: new Error("Error creating lobby") });
        return;
      }
    }
  });
}

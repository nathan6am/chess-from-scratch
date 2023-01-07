import redisClient from "../redis/sessionClient";

export async function activeGameByUserID(userID: string): Promise<string | null> {
  const game = await redisClient.get(`${userID}:game`);
  if (game) return game;
  return null;
}

import { nanoid } from "nanoid";

import * as socketio from "socket.io";
import * as chess from "@/util/chess/Chess";

export default function (io: socketio.Server, socket: socketio.Socket): void {
  socket.on("authenticate", async () => {
    //
    if (!socket.userID) {
      socket.emit("authenticated", false);
      return;
    }

    //Leave all rooms
    const rooms = socket.rooms;
    rooms.forEach((room) => {
      if (room && room !== socket.id) socket.leave(room);
    });

    //Join room for all connections of the same user - allows broadcasting events to all sessions
    //for example to disable game if active on another conection
    socket.join(socket.userID);
    socket.emit("authenticated", true);
  });
}

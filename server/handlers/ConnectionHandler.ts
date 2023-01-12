import { nanoid } from "nanoid";

import * as socketio from "socket.io";
import { Socket, Server } from "../@types/socket";

export default function (io: Server, socket: Socket): void {
  socket.on("authenticate", async (ack) => {
    //
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
}

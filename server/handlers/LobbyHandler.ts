import { nanoid } from "nanoid";

import * as socketio from "socket.io";
import redisClient from "../redis/sessionClient";
import * as chess from "@/util/chess/Chess";
export default function (io: socketio.Server, socket: socketio.Socket): void {
  socket.on("lobby:create", async () => {
    const id = nanoid(12);
    const uid = socket.userID;
    const gameJSON = chess.createGame() as any;
    redisClient.json.set(id, "$", gameJSON);
  });
}

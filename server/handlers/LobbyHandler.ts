import { nanoid } from "nanoid";
const id = nanoid(12);
import * as socketio from "socket.io";
import redis from "@/util/db/redis";

export default function (io: socketio.Server, socket: socketio.Socket): void {}

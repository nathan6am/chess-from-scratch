import React from "react";
import { io, Socket } from "socket.io-client";
import { LobbyClientToServerEvents, LobbyServerToClientEvents } from "../server/types/lobby";
import { ServerToClientEvents, ClientToServerEvents } from "@/server/types/socket";

//Create a context to resue socket connection throughout the app
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(process.env.BASEURL + "/");

export const SocketContext = React.createContext(socket);

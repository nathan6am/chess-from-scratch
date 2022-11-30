import React from "react";
import { io } from "socket.io-client";

//Create a context to resue socket connection throughout the app
export const socket = io();
export const SocketContext = React.createContext(socket);

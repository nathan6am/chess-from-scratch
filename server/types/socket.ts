import * as Chess from "../../lib/chess";
import { Lobby, Game, LobbyOptions } from "./lobby";

import * as socketio from "socket.io";

export interface Notification {
  id: string;
  type: string;
  data: any;
}

interface SocketResponse<T> {
  status: boolean;
  data?: T;
  error: Error | null;
}

export interface SocketData {
  userid: string;
  username: string;
  user: any;
  lastPing?: number;
}
export interface InterServerEvents {
  ping: () => void;
}

export interface ServerToClientEvents {
  "lobby:active": (lobby: string | null) => void;
  "challenge:recieved": (challenge: { token: string; from: { id: string; name: string } }) => void;
  "challenge:declined": (token: string) => void;
  "friend:accepted": (userid: string) => void;
  "friend:declined": (userid: string) => void;
  "notification:new": (notification: Notification) => void;
}

export interface ClientToServerEvents {
  authenticate: (ack: (authenticated: boolean) => void) => void; //Called after connect to link client to correct user on server side
  "lobby:create": (options: Partial<LobbyOptions>, ack: (response: SocketResponse<Lobby>) => void) => void;
  "lobby:active": (ack: (response: SocketResponse<string | null>) => void) => void;
  "challenge:create": (userid: string, ack: (response: SocketResponse<{ token: string }>) => void) => void;
  "challenge:cancel": (userid: string, ack: (response: SocketResponse<never>) => void) => void;
  "challenge:accept": (token: string, ack: (response: SocketResponse<Lobby>) => void) => void;
  "challenge:reject": (token: string) => void;
  "notification:acknowledge": (id: string) => void;
}

export type Server = socketio.Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type Socket = socketio.Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

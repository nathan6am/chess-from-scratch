import * as Chess from "../../util/chess";
import { Lobby, Game, Player, LobbyOptions } from "./lobby";
import * as socketio from "socket.io";
interface ChatMessage {
  message: string;
  timestampISO: string;
  author: {
    username: string;
    id: string;
  };
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
  "lobby:chat": (chat: ChatMessage[]) => void;
  "lobby:update": (updates: Partial<Lobby>) => void;
  "game:move": (
    move: Chess.Move,
    ack: (response: SocketResponse<Game>) => void
  ) => void;
  "game:outcome": (
    move: Chess.Move,
    ack: (response: SocketResponse<Game>) => void
  ) => void;
}

export interface ClientToServerEvents {
  authenticate: (ack: (authenticated: boolean) => void) => void; //Called after connect to link client to correct user on server side

  "lobby:create": (
    options: LobbyOptions,
    ack: (response: SocketResponse<Lobby>) => void
  ) => void;

  "lobby:connect": (
    lobbyid: string,
    ack: (response: SocketResponse<Lobby>) => void
  ) => void;

  "lobby:disconnect": (
    lobbyid: string,
    ack: (response: SocketResponse<string>) => void
  ) => void;

  "lobby:chat": (
    message: string,
    ack: (response: SocketResponse<ChatMessage[]>) => void
  ) => void;

  "game:move": (
    move: Chess.Move,
    ack: (response: SocketResponse<Game>) => void
  ) => void;
}

export type Server = socketio.Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
export type Socket = socketio.Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

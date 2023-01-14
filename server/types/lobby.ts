import * as Chess from "../../util/chess";

export interface LobbyOptions {
  rated: boolean;
  color: Chess.Color | "random";
  gameConfig: Chess.GameConfig;
}

export interface Game {
  id: string;
  data: Chess.Game; //Raw game data of the game
  lastMoveTimeISO: string | null; //Rime of the last recieved move as an ISO string
  timeRemainingMs: Record<Chess.Color, number>; //Clock time remaining for each color
  players: Record<Chess.Color, string>; //Player ids of each color
}

export interface Player {
  id: string; //User id of the player
  primaryClientSocketId: string; //Socket id of the primary client connection to the game
  lastPing?: number; //Last measured ping delay
  score: number; //Game score in the current lobby
}

export interface Message {
  message: string;
  author: string;
  timestampISO: string;
}

export interface Lobby {
  id: string;
  creator: string;
  reservedConnections: string[]; //User ids of any reserved connections, (the lobby creator, and the challenged player if applicable)
  players: Player[];
  options: LobbyOptions;
  currentGame: Game | null;
  chat: Message[];
}

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

export interface LobbySocketData {
  userid: string;
  username: string;
  user: any;
  lastPing?: number;
}
export interface LobbyInterServerEvents {
  ping: () => void;
}

export interface LobbyServerToClientEvents {
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

export interface LobbyClientToServerEvents {
  authenticate: (ack: (authenticated: boolean) => void) => void; //Called after connect to link client to correct user on server side

  "lobby:create": (
    options: LobbyOptions,
    ack: (response: SocketResponse<Lobby>) => void
  ) => void;

  "lobby:connect": (
    lobbyid: string,
    ack: (response: SocketResponse<Lobby>) => void
  ) => void;

  "lobby:refresh": (
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

export type LobbyServer = socketio.Namespace<
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
  LobbyInterServerEvents,
  LobbySocketData
>;
export type LobbySocket = socketio.Socket<
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
  LobbyInterServerEvents,
  LobbySocketData
>;

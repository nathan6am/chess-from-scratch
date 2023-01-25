import * as Chess from "../../lib/chess";

export interface LobbyOptions {
  rated: boolean;
  color: Chess.Color | "random";
  gameConfig: Chess.GameConfig;
}

export interface Game {
  id: string;
  data: Chess.Game; //Raw game data of the game
  clock: Clock; //Clock time remaining for each color
  players: Record<Chess.Color, string>; //Player ids of each color
}

export interface Clock {
  incrementMs: number; //Current increment per move in ms
  lastMoveTimeISO: string | null; //Time of the last recieved move as an ISO string
  timeRemainingMs: Record<Chess.Color, number>; //Clock time remaining for each color
}

export interface Player {
  id: string; //User id of the player
  primaryClientSocketId: string; //Socket id of the primary client connection to the game
  lastPing?: number; //Last measured ping delay
  rating?: number;
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
type WithTimeoutAck<
  isServer extends boolean,
  isSender extends boolean,
  args extends any[]
> = isSender extends true
  ? isServer extends true
    ? [Error, [...args]]
    : [Error, ...args]
  : isServer extends true
  ? [args]
  : args;

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

export interface LobbyServerToClientEvents<
  isServer extends boolean = false,
  isSender extends boolean = false
> {
  "lobby:chat": (chat: ChatMessage[]) => void;
  "lobby:update": (updates: Partial<Lobby>) => void;
  "game:move": (game: Game) => void;
  "game:outcome": (game: Game) => void;
  "game:new": (game: Game) => void;
  newclient: () => void;
  "test:requestAck": (
    arg: string,
    ack: (...args: WithTimeoutAck<isServer, isSender, [string]>) => void
  ) => void;
  "game:request-move": (
    timeoutSeconds: number,
    game: Game,
    ack: (...args: WithTimeoutAck<isServer, isSender, [Chess.Move]>) => void
  ) => void;
}

export interface LobbyClientToServerEvents<
  isServer extends boolean = false,
  isSender extends boolean = false
> {
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
    args: { move: Chess.Move; lobbyid: string },
    ack: (response: SocketResponse<Game>) => void
  ) => void;

  "test:timeout": () => void;
}

export type LobbyServer = socketio.Namespace<
  LobbyClientToServerEvents<false, false>,
  LobbyServerToClientEvents<true, true>,
  LobbyInterServerEvents,
  LobbySocketData
>;
export type LobbySocket = socketio.Socket<
  LobbyClientToServerEvents<false, true>,
  LobbyServerToClientEvents<false, true>,
  LobbyInterServerEvents,
  LobbySocketData
>;

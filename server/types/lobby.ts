import * as Chess from "../../lib/chess";
import { SessionUser } from "../../lib/db/entities/User";
export interface LobbyOptions {
  rated: boolean;
  color: Chess.Color | "random";
  gameConfig: Partial<Chess.GameConfig>;
}

export interface Game {
  id: string;
  data: Chess.Game; //Raw game data of the game
  clock: Clock; //Clock time remaining for each color
  players: Record<Chess.Color, Player>; //Player ids of each color
  ratingCategory: Chess.RatingCategory; //Rating category of the game
  drawOffered?: Chess.Color; //Whether a draw has been offered
  rated?: boolean; //Whether the game is rated
}

export interface Clock {
  incrementMs: number; //Current increment per move in ms
  lastMoveTimeISO: string | null; //Time of the last recieved move as an ISO string
  timeRemainingMs: Record<Chess.Color, number>; //Clock time remaining for each color
}
export interface Player extends SessionUser {
  rating?: number;
  country?: string;
}
export interface Connection {
  id: string;
  player: Player;
  lastClientSocketId: string; //Socket id of the primary client connection to the game
  lastPing?: number; //Last measured ping delay
  lastDisconnect?: string; //ISO string of the last disconnect, used to track abandoned games
  score: number; //Game score in the current lobby
  connectionStatus: boolean; //Current connection status of the last socket
}

export interface Message {
  message: string;
  author: string;
  timestampISO: string;
}

export interface Lobby {
  id: string;
  creatorId: string;
  reservedConnections: string[]; //User ids of any reserved connections, (the lobby creator, and the challenged player if applicable)
  connections: Connection[];
  options: LobbyOptions;
  currentGame: Game | null;
  chat: ChatMessage[];
  rematchRequested: Record<Chess.Color, boolean | null>;
  aborted?: boolean;
}

import * as socketio from "socket.io";
export interface ChatMessage {
  message: string;
  timestampISO: string;
  author: {
    username: string;
    id: string;
  };
}
type WithTimeoutAck<isServer extends boolean, isSender extends boolean, args extends any[]> = isSender extends true
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
  sessionUser: SessionUser;
  lastPing?: number;
}
export interface LobbyInterServerEvents {
  ping: () => void;
}

export interface LobbyServerToClientEvents<isServer extends boolean = false, isSender extends boolean = false> {
  "lobby:chat": (chat: ChatMessage[]) => void;
  "lobby:update": (updates: Partial<Lobby>) => void;
  "game:move": (game: Game) => void;
  "game:outcome": (game: Game, ratingDeltas?: Record<Chess.Color, number>) => void;
  "game:aborted": () => void;
  "game:new": (game: Game) => void;
  newclient: () => void;
  "test:requestAck": (arg: string, ack: (...args: WithTimeoutAck<isServer, isSender, [string]>) => void) => void;
  "game:request-move": (
    timeoutSeconds: number,
    game: Game,
    ack: (...args: WithTimeoutAck<isServer, isSender, [Chess.Move]>) => void
  ) => void;
  "game:draw-offered": (offeredBy: Chess.Color) => void;
  "game:draw-declined": () => void;
  "lobby:rematch-requested": (rematchOffers: Record<Chess.Color, boolean | null>) => void;
  "lobby:rematch-declined": (rematchOffers: Record<Chess.Color, boolean | null>) => void;
}

export interface LobbyClientToServerEvents<isServer extends boolean = false, isSender extends boolean = false> {
  authenticate: (ack: (authenticated: boolean) => void) => void; //Called after connect to link client to correct user on server side

  "lobby:create": (options: LobbyOptions, ack: (response: SocketResponse<Lobby>) => void) => void;

  "lobby:connect": (lobbyid: string, ack: (response: SocketResponse<Lobby>) => void) => void;

  "lobby:refresh": (lobbyid: string, ack: (response: SocketResponse<Lobby>) => void) => void;

  "lobby:disconnect": (lobbyid: string, ack: (response: SocketResponse<string>) => void) => void;

  "lobby:chat": (
    args: { message: string; lobbyid: string },
    ack: (response: SocketResponse<ChatMessage[]>) => void
  ) => void;

  "lobby:request-rematch": (
    lobbyid: string,
    ack: (response: SocketResponse<Record<Chess.Color, boolean | null>>) => void
  ) => void;

  "lobby:accept-rematch": (
    lobbyid: string,
    accepted: boolean,
    ack: (response: SocketResponse<Record<Chess.Color, boolean | null>>) => void
  ) => void;

  "game:move": (args: { move: Chess.Move; lobbyid: string }, ack: (response: SocketResponse<Game>) => void) => void;

  "game:offer-draw": (lobbyid: string) => void;

  "game:accept-draw": (lobbyid: string, accepted: boolean) => void;

  "game:resign": (lobbyid: string) => void;

  "game:abort": (lobbyid: string) => void;

  "test:timeout": () => void;

  "game:update": (lobbyid: string, ack: (response: SocketResponse<Game>) => void) => void;
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

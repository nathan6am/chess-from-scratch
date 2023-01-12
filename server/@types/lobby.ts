import * as Chess from "../../util/chess";

export interface LobbyOptions {
  rated: boolean;
  color: Chess.Color | "random";
  gameConfig: Chess.GameConfig;
}

export interface Game {
  id: string;
  data: Chess.Game;
  lastMoveTime?: string;
  timeRemainingMs?: Record<Chess.Color, number>;
  playerIDs?: Record<Chess.Color, string>;
}

export interface Lobby {
  id: string;
  connections: Array<{ player: Player; score: number }>;
  currentGame: Game;
  options: LobbyOptions;
}

export interface Player {
  id: string;
  activeSocket: string;
}

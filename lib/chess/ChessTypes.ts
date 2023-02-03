import { FinalEvaluation } from "./UciCmds";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Square = `${File}${Rank}`;

export type PieceType = "k" | "q" | "n" | "r" | "b" | "p";
export type Color = "w" | "b";

export type Coordinates = [number, number];
export interface Piece {
  color: Color;
  type: PieceType;
  key: string;
  targets?: Array<Square>;
}

export type Position = Map<Square, Piece>;

export interface HalfMove {
  move: Move;
  PGN: string;
  fen: string;
  board: Board;
  elapsedTimeSeconds?: number;
}
export type Outcome =
  | {
      result: Color | "d";
      by:
        | "agreement"
        | "resignation"
        | "timeout"
        | "timeout-w-insufficient"
        | "insufficient"
        | "repitition"
        | "checkmate"
        | "stalemate"
        | "abandonment"
        | "50-move-rule";
    }
  | undefined;
export type FullMove = [HalfMove, HalfMove | null];
export type MoveHistory = Array<FullMove>;

export interface GameState {
  position: Position;
  activeColor: Color;
  enPassantTarget: Square | null;
  castleRights: Record<Color, { kingSide: boolean; queenSide: boolean }>;
  halfMoveCount: number;
  fullMoveCount: number;
}

export type Board = Array<[Square, Piece]>;

export type Move = {
  start: Square;
  end: Square;
  capture: Square | null;
  /*"capture" will almost always be the end coordinates if there is an opposing piece on it, 
  except for en passant captures it will be the coordinates of the pawn to capture */
  isCheck?: boolean;
  isCastle?: boolean;
  promotion?: PieceType;
  isCheckMate?: boolean;
  PGN: string;
};

export enum FileEnum {
  a = 0,
  b,
  c,
  d,
  e,
  f,
  g,
  h,
}

export interface NodeData extends HalfMove {
  comments: string[];
  uci: string;
  evaluation?: FinalEvaluation;
  halfMoveCount: number;
  outcome: Outcome;
}

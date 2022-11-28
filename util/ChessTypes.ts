export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Square = `${File}${Rank}`;

export type PieceType = "k" | "q" | "n" | "r" | "b" | "p";
export type Color = "w" | "b";

export type Coordinates = [number, number];
export type Piece = { color: Color; type: PieceType };

export type Position = Map<Square, Piece>;

export interface GameState {
  position: Position;
  activeColor: Color;
  enPassantTarget: Square | null;
  castleRights: Record<Color, { kingSide: boolean; queenSide: boolean }>;
  halfMoveCount: number;
  fullMoveCount: number;
}

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
  notation?: string;
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

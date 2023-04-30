import * as Chess from "./chess/ChessTypes";
import Analysis from "@/lib/db/entities/Analysis";
import Collection from "@/lib/db/entities/Collection";
export interface AnalysisData {
  title: string;
  description?: string;
  collectionIds: string[];
  tagData: PGNTagData;
  pgn: string;
  visibility: "private" | "unlisted" | "public";
}

export interface PGNTagData {
  white?: string;
  black?: string;
  eloWhite?: string;
  eloBlack?: string;
  titleWhite?: string;
  titleBlack?: string;
  site?: string;
  event?: string;
  round?: string;
  date?: string;
  timeControl?: string;
  result?: "*" | "1-0" | "0-1" | "1/2-1/2";
  opening?: string;
  variation?: string;
  subVariation?: string;
  eco?: string;
  setUp?: "0" | "1";
  fen?: string;
}

export interface MarkedSquare {
  square: Chess.Square;
  color: ArrowColor;
}
export interface Arrow {
  start: Chess.Square;
  end: Chess.Square;
  color: ArrowColor;
}
export type ArrowColor = "R" | "G" | "O" | "B" | "Y";

export interface SavedAnalysis {
  analysis: Analysis;
  readonly?: boolean;
}
export type TreeNode<T> = {
  key: string;
  data: T;
  children: TreeNode<T>[];
  parentKey: string | null;
};

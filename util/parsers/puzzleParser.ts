import * as Chess from "@/lib/chess";
import { nodeDataFromMove, parseUciMove } from "@/lib/chess";
import { default as PuzzleEntity } from "@/lib/db/entities/Puzzle";
import _ from "lodash";

export interface Puzzle {
  id: string;
  solution: Chess.NodeData[];
  game: Chess.Game;
  playerColor: Chess.Color;
  rating: number;
  themes: string[];
}
export function parsePuzzleEntity(puzzle: PuzzleEntity): Puzzle {
  const game = Chess.createGame({
    startPosition: puzzle.fen,
  });
  const { id, rating, themes } = puzzle;
  const moves = puzzle.moves.split(" ").map((move) => parseUciMove(move));
  let solution: Chess.NodeData[] = [];
  let currentGame = _.cloneDeep(game);
  let halfMoveCount = game.fullMoveCount * 2 + (game.activeColor === "b" ? 1 : 0);
  moves.forEach((uciMove) => {
    const move = currentGame.legalMoves.find(
      (move) => move.start === uciMove.start && move.end === uciMove.end && move.promotion === uciMove.promotion
    );
    if (!move) throw new Error("invalid solution");
    solution.push(nodeDataFromMove(currentGame, move, halfMoveCount));
    currentGame = Chess.move(currentGame, move);
    halfMoveCount++;
  });
  return {
    id,
    rating,
    themes,
    game,
    solution,
    playerColor: game.activeColor === "w" ? "b" : "w",
  };
}

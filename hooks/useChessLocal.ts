import React, { useState, useEffect, useReducer, useCallback } from "react";
import * as chess from "@/util/chess/Chess";
import {
  Color,
  Move,
  Piece,
  PieceType,
  Position,
  Square,
} from "@/util/chess/ChessTypes";
import { useTimer } from "use-timer";
import { indexOf } from "lodash";

interface Game extends chess.Game {
  previousPosition?: Position;
  lastMove?: Move | null;
  boardState?: Array<PieceWithMetadata>;
}

export interface PieceWithMetadata {
  square: Square | null;
  previousSquare: Square | null;
  targets: Array<Square>;
  type: PieceType;
  color: Color;
}
function getBoardState(
  game: Game,
  lastMove: Move | null
): Array<PieceWithMetadata> {
  const boardState = [];
  const { gameState, previousPosition, legalMoves } = game;
  for (let [square, piece] of gameState.position) {
    const previousSquare = () => {
      if (!lastMove) {
        return null;
      }
      if (lastMove.end === square) {
        return lastMove.start;
      } else if (lastMove.isCastle) {
        const kingSquares = ["g1", "g8", "c1", "c8"];
        const rookSquares = [
          ["f1", "a1"],
          ["f8", "a8"],
          ["d1", "a1"],
          ["d8", "a8"],
        ];
        const rookMove =
          rookSquares[kingSquares.findIndex((sq) => sq === lastMove.end)];
        if (rookMove[0] === square) return rookMove[1];
      }
      return square;
    };
    const pieceWithMetadata = {
      ...piece,
      square: square,
      previousSquare: previousSquare() as Square,
      targets: legalMoves
        .filter((move) => move.start === square)
        .map((move) => move.end),
    };
    boardState.push(pieceWithMetadata);
  }

  if (lastMove?.capture && previousPosition) {
    const capturedPiece = previousPosition.get(lastMove.capture);
    if (capturedPiece) {
      boardState.push({
        ...capturedPiece,
        square: null,
        previousSquare: lastMove.capture as Square,
        targets: [],
      });
    }
  }
  return boardState;
}

function chessReducer(
  state: Game,
  action: { type: string; payload: any }
): Game {
  const game = state;

  switch (action.type) {
    case "move": {
      const move = action.payload;
      const updatedGame = chess.move(game, move);
      return {
        ...updatedGame,
        previousPosition: game.gameState.position,
        boardState: getBoardState(updatedGame, move),
        lastMove: move,
      };
    }
    case "resign": {
      const color: Color = action.payload;
      return {
        ...game,
        outcome: {
          result: color === "w" ? "b" : "w",
          by: "resignation",
        },
      };
    }
    default:
      return state;
  }
}
//Offline / vs Computer implementation of game logic as a react hook

interface ChessLocalState extends Game {
  previousPosition: Position;
  lastMove: Move | null;
  boardState: Array<PieceWithMetadata>;
}
export default function useChessLocal(config?: {
  startPosition: string;
  timeControls: any;
}) {
  const init = chess.createGame(config || undefined);
  const initialState: Game = {
    ...init,
    boardState: getBoardState(init, null),
    lastMove: null,
  };
  const [game, dispatch] = useReducer(chessReducer, initialState);

  const move = useCallback((move: Move) => {
    dispatch({ type: "move", payload: move });
  }, []);
  return { game, move };
}

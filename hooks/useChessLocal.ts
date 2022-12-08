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
  key: string;
}
function getBoardState(
  game: Game,
  lastMove: Move | null,
  prevGame?: Game
): Array<PieceWithMetadata> {
  const boardState = [];
  const { gameState, legalMoves } = game;
  for (let [square, piece] of gameState.position) {
    const getPreviousSquare = () => {
      if (!lastMove) {
        return null;
      }
      if (lastMove.end === square) {
        return lastMove.start;
      } else if (lastMove.isCastle) {
        const kingSquares = ["g1", "g8", "c1", "c8"];
        const rookSquares = [
          ["f1", "h1"],
          ["f8", "h8"],
          ["d1", "a1"],
          ["d8", "a8"],
        ];
        const rookMove =
          rookSquares[kingSquares.findIndex((sq) => sq === lastMove.end)];
        if (rookMove[0] === square) return rookMove[1];
      }
      return square;
    };
    const previousSquare = (getPreviousSquare() as Square) || null;
    const getKey = () => {
      if (!previousSquare || !prevGame) {
        return square;
      } else {
        const prevPiece = prevGame.boardState?.find(
          (piece) => piece.square === previousSquare
        );
        if (!prevPiece) throw new Error("previous board state not defined");
        return prevPiece.key;
      }
    };

    const pieceWithMetadata = {
      ...piece,
      square: square,
      previousSquare,
      key: getKey(),
      targets: legalMoves
        .filter((move) => move.start === square)
        .map((move) => move.end),
    };
    boardState.push(pieceWithMetadata);
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
        boardState: getBoardState(updatedGame, move, game),
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

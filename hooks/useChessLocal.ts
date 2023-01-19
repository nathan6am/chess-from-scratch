import React, { useState, useEffect, useReducer, useCallback } from "react";
import * as chess from "@/lib/chess";
import { Board, Color, Move } from "@/lib/chess/ChessTypes";

function chessReducer(state: chess.Game, action: { type: string; payload: any }): chess.Game {
  const game = state;

  switch (action.type) {
    case "move": {
      const move = action.payload;
      const updatedGame = chess.move(game, move);
      return {
        ...updatedGame,
        board: appendTargets(updatedGame),
      };
    }
    case "resign": {
      const color: chess.Color = action.payload;
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

export default function useChessLocal(config?: { startPosition: string; timeControls: any }) {
  const newGame = chess.createGame(config || undefined);

  const initialState: chess.Game = {
    ...newGame,
    board: appendTargets(newGame),
  };
  const [game, dispatch] = useReducer(chessReducer, initialState);

  const move = useCallback((move: chess.Move) => {
    dispatch({ type: "move", payload: move });
  }, []);
  return { game, move };
}

function appendTargets(game: chess.Game): chess.Board {
  const withTargets: chess.Board = game.board.map((entry) => {
    const [square, piece] = entry;
    const targets = game.legalMoves.filter((move) => move.start === square).map((move) => move.end);
    return [square, { ...piece, targets }];
  });

  return withTargets;
}

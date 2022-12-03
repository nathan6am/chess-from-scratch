import React, { useState, useEffect, useReducer, useCallback } from "react";
import * as chess from "@/util/chess/Chess";
import { Color, Move } from "@/util/chess/ChessTypes";
import { useTimer } from "use-timer";

function chessReducer(
  state: chess.Game,
  action: { type: string; payload: any }
): chess.Game {
  const game = state;

  switch (action.type) {
    case "move": {
      const move = action.payload;
      const updatedGame = chess.move(game, move);
      return updatedGame;
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
export default function useChessLocal(config: {
  startPosition: string;
  timeControls: any;
}) {
  const [game, dispatch] = useReducer(chessReducer, chess.createGame(config));

  const move = useCallback((move: Move) => {
    dispatch({ type: "move", payload: move });
  }, []);
  return { game, move };
}

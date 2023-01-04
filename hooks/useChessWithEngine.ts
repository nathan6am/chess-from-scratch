import React, { useState, useEffect, useReducer, useRef, useCallback, useLayoutEffect } from "react";
import * as chess from "@/util/chess";
import { Board, Color, Move } from "@/util/chess/ChessTypes";

function chessReducer(state: chess.Game, action: { type: string; payload: any }): chess.Game {
  const game = state;

  switch (action.type) {
    case "move": {
      const move = action.payload;
      const oldGame = { ...game };
      const updatedGame = chess.move(oldGame, move);
      return {
        ...updatedGame,
        board: appendTargets(updatedGame),
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

export default function useChessLocal(playerColor: chess.Color, config?: { startPosition: string; timeControls: any }) {
  const newGame = chess.createGame(config || undefined);

  const initialState: chess.Game = {
    ...newGame,
    board: appendTargets(newGame),
  };
  const [game, dispatch] = useReducer(chessReducer, initialState);
  const move = useCallback((move: Move) => {
    dispatch({ type: "move", payload: move });
  }, []);
  const { fen, activeColor, legalMoves } = game;
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [engineMove, setEngineMove] = useState<chess.Move | null>(null);
  var wasmSupported =
    typeof WebAssembly === "object" &&
    WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
  const stockfishRef = useRef<Worker>();
  useEffect(() => {
    stockfishRef.current = new Worker(wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js");
  }, []);
  const onMessage = useCallback((e: MessageEvent) => {
    const messageParams = e.data.split(" ");

    if (messageParams[0] === "bestmove") {
      const bestmove = messageParams[1];
      setBestMove((_) => bestmove);
    }
    //console.log(e);
  }, []);

  useLayoutEffect(() => {
    if (activeColor === playerColor) {
      setEngineMove(null);
    } else {
      if (!bestMove) return;
      const params = bestMove.match(/.{1,2}/g);
      if (!params) return;
      const [start, end, promotion] = params;
      const findMove = legalMoves.find(
        (move) => move.end === end && move.start === start && (!move.promotion || move.promotion === promotion)
      );
      if (!findMove) return;
      setEngineMove(findMove);
      move(findMove);
    }
  }, [bestMove, activeColor, legalMoves]);

  useEffect(() => {
    if (!window.Worker || !stockfishRef.current) return;
    const stockfish = stockfishRef.current;
    stockfish.addEventListener("message", onMessage);
    stockfish.postMessage("uci");
    stockfish.postMessage("setoption name Skill Level value 3");
    stockfish.postMessage("setoption name UCI_LimitStrength value true");
    stockfish.postMessage("ucinewgame");
    stockfish.postMessage("position fen " + game.fen);
    stockfish.postMessage("go depth 10");
    return () => {
      stockfish.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (!window.Worker || !stockfishRef.current) return;
    (async () => {
      await new Promise((res) => setTimeout(res, 1000));
      if (!window.Worker || !stockfishRef.current) return;
      const stockfish = stockfishRef.current;
      stockfish.postMessage("position fen " + fen);
      stockfish.postMessage("go depth 10");
      stockfish.postMessage("eval");
    })();
  }, [fen]);

  return { game, move, engineMove };
}

function appendTargets(game: chess.Game): Board {
  const withTargets: Board = game.board.map((entry) => {
    const [square, piece] = entry;
    const targets = game.legalMoves.filter((move) => move.start === square).map((move) => move.end);
    return [square, { ...piece, targets }];
  });

  return withTargets;
}

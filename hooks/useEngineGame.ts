import { useState, useEffect, useRef, useMemo, useCallback } from "react";
export type SkillPreset = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

let defaultOptions = {
  useNNUE: true,
  uciLimitStrength: false,
  uciElo: 2800,
  threads: 2,
  hash: 128,
  skillLevel: 20,
};
export const PRESETS: { [key: number]: any } = {
  1: { ...defaultOptions, uciLimitStrength: true, uciElo: 1000, skillLevel: 0 },
  2: { ...defaultOptions, uciLimitStrength: true, uciElo: 1200, skillLevel: 5 },
  3: { ...defaultOptions, uciLimitStrength: true, uciElo: 1400, skillLevel: 10 },
  4: { ...defaultOptions, uciLimitStrength: true, uciElo: 1600, skillLevel: 12 },
  5: { ...defaultOptions, uciLimitStrength: true, uciElo: 1800, skillLevel: 15 },
  6: { ...defaultOptions, uciLimitStrength: true, uciElo: 2000, skillLevel: 18 },
  7: { ...defaultOptions, uciLimitStrength: true, uciElo: 2200, skillLevel: 19 },
  8: { ...defaultOptions, uciLimitStrength: true, uciElo: 2400, skillLevel: 20 },
  9: { ...defaultOptions, uciLimitStrength: true, uciElo: 2700, skillLevel: 20 },
  10: { ...defaultOptions, uciLimitStrength: false, uciElo: 3200, skillLevel: 20 },
};

import * as Chess from "@/lib/chess";
interface Options {
  preset: SkillPreset;
  timeControl?: Chess.TimeControl;
  gameConfig: Partial<Chess.GameConfig>;
  allowTakeback?: boolean;
  playerColor?: Chess.Color;
}
import { Message, Response, EngineGameConfig } from "@/lib/stockfish/stockfishWorker";
import useChessClock from "./useChessClock";
import _ from "lodash";
import { removeUndefinedFields } from "@/util/misc";

export const useEngineGame = (options: Options) => {
  const defaultGameConfig: Chess.GameConfig = {
    startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    timeControl: null,
  };
  const gameConfig = useMemo<Chess.GameConfig>(() => {
    const configOptions = removeUndefinedFields(options.gameConfig);
    return {
      ...defaultGameConfig,
      ...configOptions,
    };
  }, [options.gameConfig]);
  const [currentGame, setCurrentGame] = useState<Chess.Game>(() => {
    console.log(gameConfig);
    return Chess.createGame(gameConfig);
  });
  const currentFen = useMemo(() => currentGame.fen, [currentGame]);
  const useClock = useMemo(() => options.timeControl !== undefined, [options.timeControl]);
  const clock = useChessClock({
    timeControl: options.timeControl || { timeSeconds: 0, incrementSeconds: 0 },
  });

  const engineGameConfig = useMemo(() => {
    return {
      ...gameConfig,
      playerColor: options.playerColor || "w",
      stockfishOptions: PRESETS[options.preset],
      timeControl: options.timeControl || null,
      depth: useClock ? "auto" : 20,
    };
  }, [gameConfig, options.playerColor, options.preset, options.timeControl]);

  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const handler = (e: MessageEvent<Response>) => {
      const response = e.data;
      console.log(response);
      if (response.type === "ready") {
        setReady(true);
      }
    };
    workerRef.current = new Worker(new URL("../lib/stockfish/stockfishWorker.ts", import.meta.url));
    workerRef.current.addEventListener("message", handler);
    workerRef.current.postMessage({ type: "isReady" });
    return () => {
      workerRef.current?.removeEventListener("message", handler);
      workerRef.current?.terminate();
    };
  }, []);

  //Register a listener for messages from the worker, remove and reregister when the callback changes

  //Start a new game once the worker is ready - only triggers once when the ready state changes from false to true
  useEffect(() => {
    if (ready && readyRef.current === false) {
      readyRef.current = true;
      workerRef.current?.postMessage({ type: "newGame", config: engineGameConfig });
    }
  }, [ready, engineGameConfig, readyRef]);

  const onMove = useCallback(
    (move: Chess.Move) => {
      const stockfish = workerRef.current;
      if (currentGame.activeColor !== options.playerColor) return;
      const legalMove = currentGame.legalMoves.find((m) => _.isEqual(m, move));
      if (!legalMove) return;
      const newGame = Chess.move(currentGame, legalMove);
      clock.press(currentGame.activeColor);
      setCurrentGame(newGame);
      stockfish?.postMessage({
        type: "move",
        fen: newGame.fen,
        timeRemaining: useClock ? clock.timeRemainingMs : undefined,
      });
    },
    [options.playerColor, currentGame, useClock, clock, workerRef]
  );

  const onEngineMove = useCallback(
    (move: Chess.UCIMove) => {
      const stockfish = workerRef.current;
      if (currentGame.activeColor === options.playerColor) return;
      const legalMove = currentGame.legalMoves.find((m) => {
        return move.start === m.start && move.end === m.end && move.promotion === m.promotion;
      });
      if (!legalMove) return;
      const newGame = Chess.move(currentGame, legalMove);
      clock.press(currentGame.activeColor);
      setCurrentGame(newGame);
      stockfish?.postMessage({ type: "move", fen: newGame.fen });
    },
    [options.playerColor, currentGame, useClock, clock.press, workerRef]
  );
  const onMessage = useCallback(
    (e: MessageEvent<any>) => {
      const response = e.data;
      console;
      if (response.type === "move") {
        const move = response.move;
        if (!move) return;
        const uciMove = Chess.parseUciMove(move);
        onEngineMove(uciMove);
      }
    },
    [onEngineMove]
  );
  useEffect(() => {
    workerRef.current?.addEventListener("message", onMessage);
    return () => {
      workerRef.current?.removeEventListener("message", onMessage);
    };
  }, [onMessage]);

  return {
    currentGame,
    onMove,
    clock,
    ready,
  };
};

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import useCurrentOpening from "./useCurrentOpening";
import useSound from "use-sound";
import useSettings from "@/hooks/useSettings";
export type SkillPreset = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
import { notEmpty } from "@/util/misc";
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
import _, { set } from "lodash";
import { removeUndefinedFields } from "@/util/misc";
import { config } from "process";
import { use } from "passport";
const defaultGameConfig: Chess.GameConfig = {
  startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  timeControl: null,
};

export const useEngineGame = (options: Options) => {
  const settings = useSettings();

  const [isThinking, setIsThinking] = useState(false);
  const gameConfig = useMemo<Chess.GameConfig>(() => {
    const configOptions = removeUndefinedFields(options.gameConfig);
    return {
      ...defaultGameConfig,
      ...configOptions,
    };
  }, [options.gameConfig]);

  //Initialize the game state
  const [currentGame, setCurrentGame] = useState<Chess.Game>(() => {
    return Chess.createGame(gameConfig);
  });
  const { opening, reset } = useCurrentOpening(currentGame);

  const [premoveQueue, setPremoveQueue] = useState<Chess.Premove[]>([]);

  //Use the chess clock if a time control is provided
  const useClock = useMemo(() => options.timeControl !== undefined, [options.timeControl]);
  const clock = useChessClock({
    timeControl: options.timeControl || { timeSeconds: 0, incrementSeconds: 0 },
    onTimeExpired: (color) => {
      if (useClock) {
        alert(`Time expired for ${color === "w" ? "White" : "Black"}`);
      }
    },
  });

  //Config for the stockfish engine
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

  //Initialize the stockfish engine worker and event listeners
  useEffect(() => {
    const handler = (e: MessageEvent<Response>) => {
      const response = e.data;
      // console.log(response);
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

  const startGame = useCallback(() => {
    workerRef.current?.postMessage({ type: "newGame", config: engineGameConfig });
  }, [workerRef, config]);
  //Start a new game once the worker is ready - only triggers once when the ready state changes from false to true
  useEffect(() => {
    if (ready && readyRef.current === false) {
      readyRef.current = true;
      workerRef.current?.postMessage({ type: "newGame", config: engineGameConfig });
    }
  }, [ready, engineGameConfig, readyRef]);

  //Handle Restarting the game
  const restartGame = useCallback(() => {
    setCurrentGame(Chess.createGame(gameConfig));
    setLivePositionOffset(0);
    clock.reset();
    reset();
    startGame();
  }, [gameConfig, startGame]);

  //Hande player moves
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
      setIsThinking(true);
    },
    [options.playerColor, currentGame, useClock, clock, workerRef]
  );

  //Handle engine moves
  const onEngineMove = useCallback(
    (move: Chess.UCIMove) => {
      const stockfish = workerRef.current;
      if (currentGame.activeColor === options.playerColor) return;
      const legalMove = currentGame.legalMoves.find((m) => {
        return move.start === m.start && move.end === m.end && move.promotion === m.promotion;
      });
      if (!legalMove) return;
      setIsThinking(false);
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
  //Flattened move history
  const moveHistoryFlat = useMemo(() => {
    if (!currentGame) return [];
    return currentGame.moveHistory.flat().filter(notEmpty);
  }, [currentGame]);

  //Start position of the current game
  const initialBoard = useMemo(() => {
    if (!currentGame) return null;
    const fen = currentGame.config.startPosition;
    const position = Chess.fenToGameState(fen);
    if (!position) return null;
    return Chess.positionToBoard(position.position);
  }, [currentGame]);

  //Offset from the live position to display on the board
  const [livePositionOffset, setLivePositionOffset] = useState(0);

  //Board to display based on the liveBoardIdx, enables cycling through past moves during a game
  const currentBoard = useMemo(() => {
    if (!currentGame) return null;
    if (livePositionOffset === 0) return currentGame.board;
    if (livePositionOffset + 1 > moveHistoryFlat.length) {
      return initialBoard;
    }
    return moveHistoryFlat[moveHistoryFlat.length - (livePositionOffset + 1)].board || null;
  }, [livePositionOffset, moveHistoryFlat, currentGame]);

  //Memoized last move played in the current game
  const lastMove = useMemo(() => {
    if (!currentGame) return null;
    if (livePositionOffset === 0) return currentGame.lastMove;
    if (livePositionOffset + 1 > moveHistoryFlat.length) {
      return null;
    }
    return moveHistoryFlat[moveHistoryFlat.length - (livePositionOffset + 1)].move || null;
  }, [livePositionOffset, moveHistoryFlat, currentGame]);

  //Premoves
  const availablePremoves = useMemo(() => {
    if (!currentGame) return [];
    return Chess.getPremoves(currentGame);
  }, [currentGame]);

  const onPremove = (premove: Chess.Premove) => {
    if (availablePremoves.some((availablePremove) => _.isEqual(premove, availablePremove))) {
      playPremove();
      setPremoveQueue([premove]);
    }
  };
  const clearPremoveQueue = () => {
    setPremoveQueue([]);
  };
  //Move sounds
  const moveVolume = useMemo(() => {
    if (!settings.sound.moveSounds) return 0;
    return settings.sound.volume / 100;
  }, [settings.sound.volume, settings.sound.moveSounds]);
  const [playMove] = useSound("/assets/sounds/move.wav", {
    volume: moveVolume,
  });
  const [playCapture] = useSound("/assets/sounds/capture.wav", {
    volume: moveVolume,
  });
  const [playCastle] = useSound("/assets/sounds/castle.wav", {
    volume: moveVolume,
  });
  const [playPremove] = useSound("/assets/sounds/premove.wav", {
    volume: moveVolume,
  });

  const lastMoveRef = useRef<Chess.Move | null>(null);
  useEffect(() => {
    if (_.isEqual(lastMoveRef.current, lastMove)) return;
    lastMoveRef.current = lastMove;
    if (lastMove) {
      if (lastMove.capture) playCapture();
      else if (lastMove.isCastle) playCastle();
      else playMove();
    }
  }, [lastMove, playMove, playCapture, playCastle, lastMoveRef]);

  const moveable = useMemo<boolean>(() => {
    if (!currentGame) return false;
    if (livePositionOffset !== 0) return false;
    return true;
  }, [livePositionOffset, currentGame]);

  //Callbacks to control the live board position
  const stepForward = useCallback(() => {
    setLivePositionOffset((cur) => (cur > 0 ? cur - 1 : cur));
  }, [moveHistoryFlat]);

  const stepBackward = useCallback(() => {
    setLivePositionOffset((cur) => (cur < moveHistoryFlat.length ? cur + 1 : cur));
  }, [moveHistoryFlat]);

  const jumpForward = () => {
    setLivePositionOffset(0);
  };
  const jumpBackward = useCallback(() => {
    setLivePositionOffset(moveHistoryFlat.length);
  }, [moveHistoryFlat]);

  const jumpToOffset = useCallback(
    (offset: number) => {
      if (offset >= 0 && offset < moveHistoryFlat.length) {
        setLivePositionOffset(offset);
      }
    },
    [moveHistoryFlat]
  );

  //Premove effectsconst
  const prevGame = useRef<Chess.Game>();
  useEffect(() => {
    if (!currentGame) return;
    if (_.isEqual(prevGame.current, currentGame)) return;
    if (!options.playerColor) return;
    if (currentGame.activeColor !== options.playerColor) return;
    if (!premoveQueue.length) return;
    const nextPremove = premoveQueue[0];
    const move = currentGame.legalMoves.find(
      (move) =>
        move.start === nextPremove.start &&
        move.end === nextPremove.end &&
        (!move.promotion || move.promotion === nextPremove.promotion)
    );
    if (!move) setPremoveQueue([]);
    else onMove(move);
    prevGame.current = currentGame;
    setPremoveQueue((cur) => cur.slice(1));
  }, [onMove, currentGame, premoveQueue, options.playerColor]);

  return {
    currentGame,
    currentBoard,
    livePositionOffset,
    lastMove,
    moveable,
    isThinking,
    onMove,
    availablePremoves,
    premoveQueue,
    clock,
    ready,
    opening,
    restartGame,
    boardControls: {
      stepBackward,
      stepForward,
      jumpBackward,
      jumpForward,
      jumpToOffset,
    },
    onPremove,
    clearPremoveQueue,
  };
};

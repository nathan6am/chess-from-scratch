import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import useSound from "use-sound";
import useSettings from "@/hooks/useSettings";
import { notEmpty } from "@/util/misc";

import * as Chess from "@/lib/chess";
interface Options {
  timeControl?: Chess.TimeControl;
  gameConfig: Partial<Chess.GameConfig>;
  allowTakeback?: boolean;
}
import { Message, Response, EngineGameConfig } from "@/lib/stockfish/stockfishWorker";
import useChessClock from "./useChessClock";
import _ from "lodash";
import { removeUndefinedFields } from "@/util/misc";
const defaultGameConfig: Chess.GameConfig = {
  startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  timeControl: null,
};

export const useLocalGame = (options: Options) => {
  //Get settings from context
  const settings = useSettings();

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
  const currentFen = useMemo(() => currentGame.fen, [currentGame]);

  //Use the chess clock if a time control is provided
  const useClock = useMemo(() => options.timeControl !== undefined, [options.timeControl]);
  const clock = useChessClock({
    timeControl: options.timeControl || { timeSeconds: 0, incrementSeconds: 0 },
  });

  //Hande moves
  const onMove = useCallback(
    (move: Chess.Move) => {
      const legalMove = currentGame.legalMoves.find((m) => _.isEqual(m, move));
      if (!legalMove) return;
      const newGame = Chess.move(currentGame, legalMove);
      clock.press(currentGame.activeColor);
      setCurrentGame(newGame);
    },
    [currentGame, useClock, clock]
  );
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

  return {
    currentGame,
    currentBoard,
    livePositionOffset,
    lastMove,
    moveable,
    onMove,
    clock,
    boardControls: {
      stepBackward,
      stepForward,
      jumpBackward,
      jumpForward,
      jumpToOffset,
    },
  };
};

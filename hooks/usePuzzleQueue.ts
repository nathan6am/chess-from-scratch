import { default as PuzzleEntity } from "@/lib/db/entities/Puzzle";
import * as Chess from "@/lib/chess";
import { gameFromNodeData, nodeDataFromMove, parseUciMove } from "@/lib/chess";
import _, { set } from "lodash";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useMemo, useRef, useCallback, useEffect, useContext } from "react";
import axios from "axios";
import { treeFromLine } from "@/util/parsers/pgnParser";
import useVariationTree from "./useVariationTree";
import useSound from "use-sound";
import { SettingsContext } from "@/context/settings";
import type { Puzzle } from "@/util/parsers/puzzleParser";
import { parsePuzzleEntity } from "@/util/parsers/puzzleParser";

interface PuzzleQueueOptions {
  minRating: number;
  maxRating: number;
  themes: string[] | null;
  showTimer: boolean;
  allowHints?: boolean;
}
interface SolvedPuzzle {
  puzzle: Puzzle;
  solved: boolean;
  hintUsed: boolean;
}

const defaultOptions = {
  minRating: 500,
  maxRating: 3000,
  themes: null,
  showTimer: true,
  allowHints: false,
};
import useDebounce from "./useDebounce";
import s from "connect-redis";
export default function usePuzzleQueue(_options: Partial<PuzzleQueueOptions> = {}) {
  const options = useMemo(
    () => ({
      ...defaultOptions,
      ..._options,
    }),
    [_options]
  );
  //Debounce query options to prevent spamming the server
  const debouncedOptions = useDebounce(options, 500);
  // let [rated, setRated] = useState(true);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<SolvedPuzzle[]>([]);
  const [queue, setQueue] = useState<Puzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const filters = useMemo(() => {
    return {
      minRating: options.minRating,
      maxRating: options.maxRating,
      themes: options.themes,
    };
  }, [options]);

  //Reset the queue when filters change
  useEffect(() => {
    setQueue((queue) => (currentPuzzle ? [currentPuzzle] : []));
  }, [filters.maxRating, filters.minRating, filters.themes]);

  const { error, isLoading, refetch } = useQuery({
    queryKey: ["puzzleQueue", debouncedOptions],
    queryFn: async () => {
      const response = await axios.get<{ puzzles: PuzzleEntity[] }>("/api/puzzles", {
        params: {
          minRating: debouncedOptions.minRating,
          maxRating: debouncedOptions.maxRating,
          themes: debouncedOptions.themes?.join(",") || null,
        },
      });
      if (response && response.data.puzzles) return response.data.puzzles;
      else throw new Error();
    },
    onSuccess(data) {
      try {
        const puzzles = data.map((entity) => parsePuzzleEntity(entity));
        //Push the puzzles to the queue on success
        setQueue((queue) => [...queue, ...puzzles]);
      } catch (e) {
        console.error(e);
      }
    },
  });

  const puzzle = usePuzzle({
    puzzle: currentPuzzle,
    onSolve: () => {
      if (currentPuzzle) setHistory((cur) => [...cur, { solved: true, puzzle: currentPuzzle, hintUsed: false }]);
      setStreak((cur) => cur + 1);
    },
    onFail: () => {
      if (currentPuzzle) setHistory((cur) => [...cur, { solved: false, puzzle: currentPuzzle, hintUsed: false }]);
      setStreak(0);
    },
  });

  //Load the next puzzle
  const next = useCallback(() => {
    if (currentPuzzle && puzzle.solveState === "pending") return;
    if (!queue.length) return;
    if (!currentPuzzle) {
      let nextPuzzle = queue[0];
      setQueue((current) => current.slice(1));
      setCurrentPuzzle(nextPuzzle);
    } else {
      setHistory((cur) => [...cur, { solved: puzzle.solveState === "solved", puzzle: currentPuzzle, hintUsed: false }]);
      let nextPuzzle = queue[0];
      setQueue((current) => current.slice(1));
      setCurrentPuzzle(nextPuzzle);
    }
  }, [queue, puzzle.solveState, currentPuzzle]);

  useEffect(() => {
    //Automatically load the next puzzle if current puzzle is null
    if (!currentPuzzle && queue.length) {
      next();
    }
    //Fetch new puzzles when the queue length is below minimum threshold
    if (queue.length < 5) {
      refetch();
    }
  }, [queue, currentPuzzle, next]);
  return {
    streak,
    next,
    puzzle,
    history,
    options,
  };
}

interface PuzzleOptions {
  puzzle: Puzzle | null;
  onSolve?: () => void;
  onFail?: () => void;
}
function usePuzzle({ puzzle, onSolve, onFail }: PuzzleOptions) {
  const { settings } = useContext(SettingsContext);
  const lastPuzzleId = useRef<string | null>(null);
  const tree = useVariationTree();
  //Reset on puzzle change

  const { currentNode, path, continuation, currentKey, mainLine, setCurrentKey, stepBackward } = tree;
  const currentGame = useMemo(() => {
    if (!puzzle) return Chess.createGame({});
    if (currentNode)
      return gameFromNodeData(
        currentNode.data,
        puzzle.game.fen,
        path.map((node) => node.data)
      );
    else return puzzle.game;
  }, [puzzle, currentNode]);

  const [orientation, setOrientation] = useState<Chess.Color>(puzzle?.playerColor || "w");
  const [solveState, setSolveState] = useState<"pending" | "solved" | "failed">("pending");
  const [hint, setHint] = useState<Chess.Square | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const isMainline = useMemo(
    () => currentKey === null || mainLine.some((node) => node.key === currentKey),
    [currentKey, mainLine]
  );
  const [touchedKeys, setTouchedKeys] = useState<string[]>([]);
  const visibleNodes = useMemo(() => {
    const lastIdx = mainLine.findIndex((node) => !touchedKeys.includes(node.key));
    return mainLine.slice(0, lastIdx);
  }, [mainLine, touchedKeys]);

  const moveable = useMemo(() => {
    if (continuation.length === 0) return false;
    if (currentGame.activeColor !== puzzle?.playerColor) return false;
    if (!isMainline) return false;
    if (currentKey !== visibleNodes[visibleNodes.length - 1]?.key) return false;
    return true;
  }, [continuation, currentGame, currentKey, isMainline, visibleNodes]);

  const retry = useCallback(() => {
    if (isMainline) return;
    setCurrentKey(currentNode?.parentKey || null);
  }, [isMainline, path, currentNode]);

  const annotation = useMemo(() => {
    if (currentKey && !isMainline) return "puzzle-failed";
    else if (currentKey && isMainline && continuation.length === 0) return "puzzle-solved";
    return undefined;
  }, [currentKey, isMainline, continuation]);
  const [playSuccess] = useSound("/assets/sounds/success.mp3", { volume: settings.sound.volume / 100 });

  useEffect(() => {
    if (!puzzle) return;
    if (!currentKey) return;
    const lastMove = mainLine[mainLine.length - 1];
    if (currentKey === lastMove.key && solveState !== "failed") {
      setSolveState("solved");
    }
  }, [mainLine, currentKey, puzzle]);

  const prompt = useMemo(() => {
    if (mainLine.length && mainLine.every((node) => touchedKeys.includes(node.key))) return "solved";
    if (currentNode && !isMainline) return "failed";
    if (visibleNodes.length <= 1) return "start";
    if (continuation.length > 0) return "continue";
    return "loading";
  }, [visibleNodes, mainLine, currentNode, touchedKeys, continuation]);

  const onMove = useCallback(
    (move: Chess.Move) => {
      if (!moveable) return;
      const existingMoveKey = tree.findNextMove(Chess.MoveToUci(move));
      if (existingMoveKey) {
        tree.setCurrentKey(existingMoveKey);
        setTouchedKeys((cur) => [...cur, existingMoveKey]);
      } else {
        if (onFail) onFail();
        setSolveState("failed");
        const halfMoveCount = currentNode?.data.halfMoveCount || 1;
        const nodeToInsert = Chess.nodeDataFromMove(currentGame, move, halfMoveCount);
        tree.addMove(nodeToInsert);
      }
    },
    [currentGame, tree, currentNode, moveable, mainLine]
  );

  useEffect(() => {
    if (!puzzle) return;
    if (currentGame.activeColor === puzzle?.playerColor) return;
    const nextKey = continuation[0]?.key;
    if (touchedKeys.includes(nextKey)) return;
    const nextMove = tree.stepForward();
    setTouchedKeys((cur) => [...cur, nextMove?.key || nextKey]);
  }, [currentGame, isMainline, tree, continuation, puzzle]);

  const [playMove] = useSound("/assets/sounds/move.wav", { volume: settings.sound.volume / 100 });
  const [playCapture] = useSound("/assets/sounds/capture.wav", {
    volume: settings.sound.volume / 100,
  });
  const [playCastle] = useSound("/assets/sounds/castle.wav", {
    volume: settings.sound.volume / 100,
  });
  const lastMove = currentGame.lastMove;
  useEffect(() => {
    if (lastMove && settings.sound.moveSounds) {
      if (lastMove.capture) playCapture();
      else if (lastMove.isCastle) playCastle();
      else playMove();
    }
  }, [lastMove, playMove, playCapture, playCastle]);

  const firstMoveRef = useRef(true);

  // useEffect(() => {
  //   if (firstMoveRef.current) return;
  //   if (solveState !== "pending") return;
  //   firstMoveRef.current = true;
  //   if (!opponentMoveQueued.current) {
  //     opponentMoveQueued.current = true;
  //     setTimeout(() => {
  //       opponentMoveQueued.current = false;
  //       const nextMove = tree.stepForward();
  //       if (nextMove) setTouchedKeys((cur) => [...cur, nextMove.key]);
  //     }, 500);
  //   }
  // }, [firstMoveRef, tree, solveState]);
  const stepForward = useCallback(() => {
    const nextNode = continuation[0];
    if (nextNode && touchedKeys.includes(nextNode.key)) {
      setCurrentKey(nextNode.key);
    }
  }, [continuation, visibleNodes, touchedKeys]);
  const jumpBackward = () => {
    setCurrentKey(null);
  };
  const jumpForward = useCallback(() => {
    setCurrentKey(visibleNodes[visibleNodes.length - 1].key);
  }, [visibleNodes]);

  const showSolution = useCallback(() => {
    const lastKey = visibleNodes[visibleNodes.length - 1].key;
    // console.log(lastKey);
    // console.log(visibleNodes);
    setSolveState("failed");
    setTouchedKeys(mainLine.map((node) => node.key));
    if (!isMainline) {
      setCurrentKey(currentNode?.parentKey || null);
    }
    const idx = mainLine.findIndex((node) => node.key === lastKey);
    setCurrentKey(mainLine[idx + 1]?.key || null);
  }, [currentKey, tree, isMainline, mainLine, visibleNodes]);

  const getHint = useCallback(() => {
    if (!puzzle) return;
    const nextNode = mainLine.find((node) => !touchedKeys.includes(node.key));
    console.log(nextNode);
    jumpForward();
    if (!nextNode) return;
    setHintUsed(true);
    const hintSquare = nextNode.data.move.start;
    setHint(hintSquare);
  }, [puzzle, currentKey, visibleNodes, touchedKeys, mainLine, jumpForward]);

  useEffect(() => {
    setHint(null);
  }, [currentKey]);

  useEffect(() => {
    if (!puzzle) return;
    if (lastPuzzleId.current === puzzle.id) return;
    lastPuzzleId.current = puzzle.id;
    tree.loadNewTree(treeFromLine(puzzle.solution));
    setOrientation(puzzle.playerColor);
    setSolveState("pending");
    firstMoveRef.current = false;
  }, [puzzle, tree.loadNewTree, firstMoveRef]);

  const prevSolveState = useRef(solveState);
  useEffect(() => {
    if (solveState !== prevSolveState.current) {
      prevSolveState.current = solveState;
      if (solveState === "solved") {
        if (onSolve) onSolve();
        playSuccess();
      }
    }
  }, [solveState, playSuccess]);

  return {
    puzzle,
    orientation,
    getHint,
    flipBoard: () => setOrientation((cur) => (cur === "w" ? "b" : "w")),
    currentGame,
    solveState,
    annotation,
    showSolution,
    retry,
    onMove,
    moveable,
    controls: {
      stepForward,
      stepBackward,
      jumpBackward,
      jumpForward,
    },
    prompt,
  };
}

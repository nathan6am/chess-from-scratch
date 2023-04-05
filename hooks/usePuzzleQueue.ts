import { default as PuzzleEntity } from "@/lib/db/entities/Puzzle";
import * as Chess from "@/lib/chess";
import { gameFromNodeData, nodeDataFromMove, parseUciMove } from "@/lib/chess";
import _ from "lodash";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useRef, useCallback, useEffect, useContext } from "react";
import axios from "axios";
import { treeFromLine } from "@/util/parsers/pgnParser";
import useVariationTree from "./useVariationTree";
import useSound from "use-sound";
import { SettingsContext } from "@/context/settings";

export interface Puzzle {
  id: string;
  solution: Chess.NodeData[];
  game: Chess.Game;
  playerColor: Chess.Color;
  rating: number;
  themes: string[];
}
function parsePuzzleEntity(puzzle: PuzzleEntity): Puzzle {
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
  minRating: 0,
  maxRating: 4000,
  themes: null,
  showTimer: true,
  allowHints: false,
};
export default function usePuzzleQueue(initialOptions?: Partial<PuzzleQueueOptions>) {
  const [options, setOptions] = useState<PuzzleQueueOptions>({
    ...defaultOptions,
    ...initialOptions,
  });
  const [history, setHistory] = useState<SolvedPuzzle[]>([]);
  const [queue, setQueue] = useState<Puzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["puzzleQueue", options],
    queryFn: async () => {
      const response = await axios.get<{ puzzles: PuzzleEntity[] }>("/api/puzzles", {
        params: {
          minRating: options.minRating,
          maxRating: options.maxRating,
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

  const puzzle = usePuzzle(currentPuzzle);

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
    next,
    puzzle,
    history,
    options,
    setOptions,
  };
}

function usePuzzle(puzzle: Puzzle | null) {
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
  const [hintUsed, setHintUsed] = useState(false);
  const isMainline = useMemo(
    () => currentKey === null || mainLine.some((node) => node.key === currentKey),
    [currentKey, mainLine]
  );
  const [touchedKeys, setTouchedKeys] = useState<string[]>([]);
  const visibleNodes = useMemo(() => {
    const lastIdx = mainLine.findIndex((node) => !touchedKeys.includes(node.key));
    return mainLine.slice(0, lastIdx);
  }, [mainLine]);
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
  useEffect(() => {
    if (!puzzle) return;
    if (!currentKey) return;
    const lastMove = mainLine[mainLine.length - 1];
    if (currentKey === lastMove.key && solveState !== "failed") setSolveState("solved");
  }, [mainLine, currentKey, puzzle]);
  const prompt = useMemo(() => {
    if (currentNode && !isMainline) return "failed";
    if (isMainline && currentNode && visibleNodes.length === 1) return "start";
    if (isMainline && currentNode && continuation.length > 0) return "continue";
    return "solved";
  }, [visibleNodes, mainLine, currentNode]);
  const onMove = useCallback(
    (move: Chess.Move) => {
      if (!moveable) return;
      const existingMoveKey = tree.findNextMove(Chess.MoveToUci(move));
      if (existingMoveKey) {
        tree.setCurrentKey(existingMoveKey);
        setTouchedKeys((cur) => [...cur, existingMoveKey]);
      } else {
        setSolveState("failed");
        const halfMoveCount = currentNode?.data.halfMoveCount || 1;
        const nodeToInsert = Chess.nodeDataFromMove(currentGame, move, halfMoveCount);
        tree.addMove(nodeToInsert);
      }
    },
    [currentGame, tree, currentNode]
  );
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
  const opponentMoveQueued = useRef<boolean>(false);
  useEffect(() => {
    if (!puzzle) return;
    if (opponentMoveQueued.current) return;
    if (currentGame.activeColor !== puzzle.playerColor) {
      if (visibleNodes.length && currentKey !== visibleNodes[visibleNodes.length - 1].key) return;
      opponentMoveQueued.current = true;
      setTimeout(() => {
        opponentMoveQueued.current = false;
        const nextMove = tree.stepForward();
        if (nextMove) setTouchedKeys((cur) => [...cur, nextMove.key]);
      }, 500);
    }
  }, [currentGame, puzzle, tree, currentKey, opponentMoveQueued, visibleNodes]);
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
    setSolveState("failed");
    setTouchedKeys(mainLine.map((node) => node.key));
    if (!isMainline) {
      setCurrentKey(currentNode?.parentKey || null);
    }
    tree.stepForward();
  }, [currentKey, tree, isMainline, mainLine]);

  useEffect(() => {
    if (!puzzle) return;
    if (lastPuzzleId.current === puzzle.id) return;
    lastPuzzleId.current = puzzle.id;
    tree.loadNewTree(treeFromLine(puzzle.solution));
    setOrientation(puzzle.playerColor);
    setSolveState("pending");
  }, [puzzle, tree.loadNewTree]);

  return {
    puzzle,
    orientation,
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

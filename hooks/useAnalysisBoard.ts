import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import useSound from "use-sound";
import useVariationTree from "./useVariationTree";
import useLocalEval, { Evaler } from "./useLocalEval";
import useDebounce from "./useDebounce";
import useOpeningExplorer from "./useOpeningExplorer";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import { TreeNode } from "./useTreeData";
import { BoardControls } from "./useChessOnline";
import { ApiResponse } from "./useOpeningExplorer";
import { pgnToTreeArray } from "./test";
type Node = TreeNode<Chess.NodeData>;

export interface AnalysisHook {
  currentKey: string | null;
  currentNode: Node | null;
  pgn: string;
  mainLine: Node[];
  rootNodes: Node[];
  currentGame: Chess.Game;
  onMove: (move: Chess.Move) => void;
  evaler: Evaler;
  evalEnabled: boolean;
  setEvalEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  boardControls: {
    stepForward: () => void;
    stepBackward: () => void;
    jumpForward: () => void;
    jumpBackward: () => void;
  };
  variations: Node[];
  setCurrentKey: React.Dispatch<React.SetStateAction<string | null>>;
  currentLine: Node[];
  path: Node[];
  debouncedNode: Node | null;
  explorer: {
    data: ApiResponse | undefined;
    error: unknown;
    isLoading: boolean;
  };
  setMoveQueue: React.Dispatch<React.SetStateAction<string[]>>;
  commentControls: {
    updateComment: (nodeId: string, comment: string) => void;
    removeAnnotation: (nodeId: string, annotation: number) => void;
    insertAnnotation: (nodeId: string, annotation: number) => void;
  };
}

interface AnalysisOptions {
  startPosition: string;
  initialTree?: TreeNode<Chess.NodeData>[];
  pgnSource?: string;
  evalEnabled: boolean;
}
const defaultOptions = {
  startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  evalEnabled: true,
};
export default function useAnalysisBoard(initialOptions?: Partial<AnalysisOptions>): AnalysisHook {
  const options = { ...defaultOptions, ...initialOptions };
  const [evalEnabled, setEvalEnabled] = useState(true);
  const [startPosEval, setStartPosEval] = useState<Chess.FinalEvaluation | undefined>();
  const evaler = useLocalEval();
  const initialGame = useMemo<Chess.Game>(() => {
    const game = Chess.createGame({
      startPosition: options.startPosition,
      timeControls: null,
    });
    return game;
  }, []);

  const initialTree = useMemo(() => {
    if (options.pgnSource) {
      try {
        const tree = pgnToTreeArray(options.pgnSource, options.startPosition);
        return tree;
      } catch (e) {
        console.log(e);
        return [];
      }
    }
  }, [options.pgnSource, options.startPosition]);
  const variationTree = useVariationTree(initialTree);

  const {
    currentNode,
    path,
    continuation,
    stepBackward,
    stepForward,
    currentKey,
    pgn,
    mainLine,
    setCurrentKey,
  } = variationTree;

  useEffect(() => {
    const arrowKeyHandler = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight") {
        stepForward();
      } else if (e.code === "ArrowLeft") {
        stepBackward();
      }
    };
    document.addEventListener("keydown", arrowKeyHandler);
    return () => {
      document.removeEventListener("keydown", arrowKeyHandler);
    };
  }, [stepForward, stepBackward]);
  const currentGame = useMemo<Chess.Game>(() => {
    if (currentNode === null) return initialGame;
    return Chess.gameFromNodeData(
      currentNode.data,
      options.startPosition,
      path.map((node) => node.data)
    );
  }, [currentNode, initialGame, options.startPosition, path]);

  const explorer = useOpeningExplorer(currentGame);
  //Move sounds
  const [playMove] = useSound("/assets/sounds/move.wav");
  const [playCapture] = useSound("/assets/sounds/capture.wav");
  const [playCastle] = useSound("/assets/sounds/castle.wav");
  const lastMove = currentGame.lastMove;
  useEffect(() => {
    if (lastMove) {
      if (lastMove.capture) playCapture();
      else if (lastMove.isCastle) playCastle();
      else playMove();
    }
  }, [lastMove, playMove, playCapture, playCastle]);

  const cacheEvaluation = useCallback(
    (nodeId: string, evaluation: Chess.FinalEvaluation) => {
      variationTree.tree.updateNode(nodeId, {
        evaluation,
      });
    },
    [variationTree.tree]
  );

  const updateComment = useCallback(
    (nodeId: string, comment: string) => {
      const node = variationTree.tree.getNode(nodeId);
      if (!node) return;

      variationTree.tree.updateNode(nodeId, {
        comment: comment.length ? comment : null,
      });
    },
    [variationTree.tree]
  );

  const insertAnnotation = useCallback(
    (nodeId: string, annotation: number) => {
      const node = variationTree.tree.getNode(nodeId);
      if (!node) return;
      const annotations = node.data.annotations;
      annotations.push(annotation);
      variationTree.tree.updateNode(nodeId, {
        annotations,
      });
    },
    [variationTree.tree]
  );

  const removeAnnotation = useCallback(
    (nodeId: string, annotation: number) => {
      const node = variationTree.tree.getNode(nodeId);
      if (!node) return;
      const annotations = node.data.annotations.filter((cur) => cur !== annotation);
      variationTree.tree.updateNode(nodeId, {
        annotations,
      });
    },
    [variationTree.tree]
  );
  //Debounce data change for evaler/api request
  const debouncedNode = useDebounce(currentNode, 300);
  const currentNodeKey = useRef<string | null>();
  useEffect(() => {
    if (currentNodeKey.current === (debouncedNode?.key || null)) {
      return;
    }
    if (!evalEnabled) {
      evaler.stop();
    }
    if (evaler.isReady && evalEnabled) {
      currentNodeKey.current = debouncedNode?.key || null;
      if (!debouncedNode) {
        evaler.getEvaluation(initialGame.fen, startPosEval).then((result) => {
          if (result) {
            setStartPosEval(result);
          }
        });
      } else {
        evaler
          .getEvaluation(debouncedNode.data.fen, debouncedNode.data.evaluation)
          .then((result) => {
            if (result) cacheEvaluation(debouncedNode.key, result);
          });
      }
    }
  }, [evaler.isReady, debouncedNode, evalEnabled, cacheEvaluation, initialGame, startPosEval]);

  const currentLine = useMemo(() => {
    return [...path, ...continuation];
  }, [path, continuation]);

  const onMove = useCallback(
    (move: Chess.Move) => {
      const existingMoveKey = variationTree.findNextMove(Chess.MoveToUci(move));
      if (existingMoveKey) {
        const next = variationTree.setCurrentKey(existingMoveKey);
        //if (next) evaler.getEvaluation(next.data.fen);
      } else {
        const halfMoveCount = variationTree.path.length + 1;
        const nodeToInsert = Chess.nodeDataFromMove(currentGame, move, halfMoveCount);
        variationTree.addMove(nodeToInsert);
        //evaler.getEvaluation(nodeToInsert.fen);
      }
    },
    [currentGame, variationTree]
  );

  const jumpForward = useCallback(() => {
    const node = currentLine[currentLine.length - 1];
    setCurrentKey(node?.key || null);
  }, [currentLine]);

  const jumpBackward = () => {
    setCurrentKey(null);
  };

  const [moveQueue, setMoveQueue] = useState<string[]>([]);
  const prevLastMove = useRef(lastMove);
  useEffect(() => {
    if (prevLastMove.current === currentGame.lastMove && prevLastMove.current !== null) return; //"don't execute if a the game hasn't updated"
    prevLastMove.current === currentGame.lastMove;
    const move = currentGame.legalMoves.find((move) => move.PGN === moveQueue[0]);
    if (move) {
      setTimeout(() => {
        onMove(move);
        setMoveQueue((cur) => cur.slice(1));
      }, 200);
    } else {
      return;
    }
  }, [moveQueue, currentGame, onMove, prevLastMove]);

  return {
    pgn,
    mainLine,
    rootNodes: variationTree.rootNodes,
    currentGame,
    onMove,
    evaler,
    evalEnabled,
    setEvalEnabled,
    boardControls: { stepBackward, stepForward, jumpBackward, jumpForward },
    variations: variationTree.treeArray,
    setCurrentKey,
    currentLine,
    path,
    setMoveQueue,
    currentKey,
    currentNode,
    debouncedNode,
    explorer,
    commentControls: {
      updateComment,
      removeAnnotation,
      insertAnnotation,
    },
  };
}

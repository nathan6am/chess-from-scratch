import { useCallback, useEffect, useMemo, useState, useRef, useContext } from "react";
import { SettingsContext } from "@/context/settings";
import useSound from "use-sound";
import useVariationTree from "./useVariationTree";
import useLocalEval, { Evaler } from "./useLocalEval";
import useDebounce from "./useDebounce";
import useOpeningExplorer, { ExplorerHook } from "./useOpeningExplorer";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import { TreeNode } from "./useTreeData";
import { ApiResponse } from "./useOpeningExplorer";
import { pgnToTreeArray } from "./test";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
type Node = TreeNode<Chess.NodeData>;
export interface AnalysisData {
  title: string;
  description?: string;
  collectionIds: string[];
  tagData: PGNTagData;
  pgn: string;
  visibility: "private" | "unlisted" | "public";
}
export interface AnalysisHook {
  loadPgn: (pgn: string) => void;
  currentKey: string | null;
  currentNode: Node | null;
  moveText: string;
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
  explorer: ExplorerHook;
  setMoveQueue: React.Dispatch<React.SetStateAction<string[]>>;
  commentControls: {
    updateComment: (nodeId: string, comment: string) => void;
    updateAnnotations: (nodeId: string, annotations: number[]) => void;
  };
}

interface AnalysisOptions {
  startPosition: string;
  initialTree?: TreeNode<Chess.NodeData>[];
  pgnSource?: string;
  evalEnabled: boolean;
  id?: string;
  readonly: boolean;
}
const defaultOptions = {
  startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  evalEnabled: true,
  readonly: false,
};
import axios from "axios";
import Analysis from "@/lib/db/entities/Analysis";
import { PGNTagData, parsePgn } from "@/util/parsers/pgnParser";
import useSavedAnalysis from "./useSavedAnalysis";

export default function useAnalysisBoard(initialOptions?: Partial<AnalysisOptions>): AnalysisHook {
  const [options, setOptions] = useState(() => {
    return { ...defaultOptions, ...initialOptions };
  });
  const { settings } = useContext(SettingsContext);
  const { id } = options;
  const [evalEnabled, setEvalEnabled] = useState(() => options.evalEnabled);
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
        const { tree, tagData } = parsePgn(options.pgnSource);
        if (tagData.fen) {
          setOptions((cur) => {
            return { ...cur, startPosition: tagData.fen || defaultOptions.startPosition };
          });
        }
        return tree;
      } catch (e) {
        console.log(e);
        return [];
      }
    }
  }, [options.pgnSource, options.startPosition]);
  const variationTree = useVariationTree(initialTree);

  const loadPgn = (pgn: string) => {
    try {
      const { tree, tagData } = parsePgn(pgn);
      if (tagData.fen) {
        setOptions((cur) => {
          return { ...cur, startPosition: tagData.fen || defaultOptions.startPosition };
        });
      }
      variationTree.loadNewTree(tree);
    } catch (e) {
      console.error(e);
    }
  };

  const { currentNode, path, continuation, stepBackward, stepForward, currentKey, moveText, mainLine, setCurrentKey } =
    variationTree;

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

  const updateAnnotations = useCallback(
    (nodeId: string, annotations: number[]) => {
      const node = variationTree.tree.getNode(nodeId);
      if (!node) return;
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
        let fen = debouncedNode.data.fen;
        const game = Chess.gameFromNodeData(debouncedNode.data);
        if (!game.legalMoves.some((move) => move.capture && move.end === game.enPassantTarget)) {
          const args = fen.split(" ");
          args[3] = "-";
          fen = args.join(" ");
        }
        evaler.getEvaluation(fen, debouncedNode.data.evaluation).then((result) => {
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
  const prevGame = useRef(initialGame);
  const prevMoveQueue = useRef<string[]>([]);
  useEffect(() => {
    if (_.isEqual(prevGame, currentGame)) return; //"don't execute if a the game hasn't updated"
    prevGame.current === currentGame;
    if (!moveQueue.length) return;
    const move = currentGame.legalMoves.find((move) => move.PGN === moveQueue[0]);
    if (move) {
      setTimeout(() => {
        onMove(move);
        setMoveQueue((cur) => cur.slice(1));
      }, 200);
    } else {
      console.error("Invalid move in move queue");
    }
  }, [moveQueue, currentGame, onMove, prevGame]);

  return {
    loadPgn,
    moveText,
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
      updateAnnotations,
    },
  };
}

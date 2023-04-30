import { useCallback, useEffect, useMemo, useState, useRef, useContext } from "react";
import { SettingsContext } from "@/context/settings";
import useSound from "use-sound";
import useVariationTree, { VariationTree } from "./useVariationTree";
import useEvaler, { Evaler } from "./useEvaler";
import useDebounce from "./useDebounce";
import useOpeningExplorer, { ExplorerHook } from "./useOpeningExplorer";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import { PGNTagData, AnalysisData, ArrowColor, MarkedSquare, Arrow, TreeNode } from "@/lib/types";
type Node = TreeNode<Chess.NodeData>;

export interface AnalysisHook {
  tree: VariationTree;
  loadPgn: (pgn: string) => void;
  pgn: string;
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
  markupControls: {
    onArrow: (arrow: Arrow) => void;
    onMarkSquare: (square: MarkedSquare) => void;
    onClear: () => void;
    arrowColor: ArrowColor;
    setArrowColor: (color: ArrowColor) => void;
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

import { parsePgn, tagDataToPGNString } from "@/util/parsers/pgnParser";

export default function useAnalysisBoard(initialOptions?: Partial<AnalysisOptions>): AnalysisHook {
  const [options, setOptions] = useState(() => {
    return { ...defaultOptions, ...initialOptions };
  });
  const { settings } = useContext(SettingsContext);
  const { id } = options;
  const [evalEnabled, setEvalEnabled] = useState(() => options.evalEnabled);
  const [startPosEval, setStartPosEval] = useState<Chess.FinalEvaluation | undefined>();
  const [tagData, setTagData] = useState<PGNTagData>({});

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
      console.log(tagData);
      setTagData({
        event: tagData.event === "?" ? undefined : tagData.event,
        site: tagData.site === "?" ? undefined : tagData.site,
        date: tagData.date === "????.??.??" ? undefined : tagData.date,
        round: tagData.round === "?" ? undefined : tagData.round,
        ...tagData,
      });
      variationTree.loadNewTree(tree);
    } catch (e) {
      console.error(e);
    }
  };

  const {
    currentNode,
    path,
    continuation,
    stepBackward,
    stepForward,
    currentKey,
    moveText,
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

  const pgn = useMemo(() => {
    const tagSection = tagDataToPGNString(tagData);
    return tagSection + "\r\n" + moveText + (tagData?.result || "*");
  }, [moveText, tagData]);

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
    (evaluation: Chess.FinalEvaluation) => {
      if (currentKey === null) setStartPosEval(evaluation);
      else
        variationTree.tree.updateNode(currentKey, {
          evaluation,
        });
    },
    [variationTree.tree, currentKey]
  );
  const cachedEvaluation = useMemo(() => {
    if (currentNode) return currentNode.data.evaluation || null;
    else return startPosEval || null;
  }, [currentNode, startPosEval]);

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

  const updateArrows = useCallback(
    (nodeId: string, arrows: Arrow[]) => {
      const node = variationTree.tree.getNode(nodeId);
      if (!node) return;
      variationTree.tree.updateNode(nodeId, {
        arrows,
      });
    },
    [variationTree.tree]
  );
  const updateMarkedSquares = useCallback(
    (nodeId: string, markedSquares: MarkedSquare[]) => {
      const node = variationTree.tree.getNode(nodeId);
      if (!node) return;
      variationTree.tree.updateNode(nodeId, {
        markedSquares,
      });
    },
    [variationTree.tree]
  );

  const clearMarkup = useCallback(
    (nodeId: string) => {
      const node = variationTree.tree.getNode(nodeId);
      if (!node) return;
      variationTree.tree.updateNode(nodeId, {
        markedSquares: [],
        arrows: [],
      });
    },
    [variationTree.tree]
  );

  //Debounce data change for evaler/api request

  const debouncedNode = useDebounce(currentNode, 300);
  const debouncedGame = useDebounce(currentGame, 300);

  //const evaler = useEvaler(debouncedFen, !evalEnabled);
  const evaler = useEvaler(currentGame.fen);
  // useEffect(() => {
  //   if (currentNodeKey.current === (debouncedNode?.key || null)) {
  //     return;
  //   }
  //   if (!evalEnabled) {
  //     evaler.stop();
  //   }
  //   if (evaler.isReady && evalEnabled) {
  //     currentNodeKey.current = debouncedNode?.key || null;
  //     if (!debouncedNode) {
  //       evaler.getEvaluation(initialGame.fen, startPosEval).then((result) => {
  //         if (result) {
  //           setStartPosEval(result);
  //         }
  //       });
  //     } else {

  //       evaler.getEvaluation(fen, debouncedNode.data.evaluation).then((result) => {
  //         if (result) cacheEvaluation(debouncedNode.key, result);
  //       });
  //     }
  //   }
  // }, [evaler.isReady, debouncedNode, evalEnabled, cacheEvaluation, initialGame, startPosEval]);

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
  const onArrow = useCallback(
    (arrow: Arrow) => {
      if (!currentNode) return;
      const currentArrows = currentNode.data.arrows || [];
      if (currentArrows.some((cur: Arrow) => cur.start === arrow.start && cur.end === arrow.end)) {
        updateArrows(
          currentNode.key,
          currentArrows.filter(
            (cur: Arrow) => !(cur.start === arrow.start && cur.end === arrow.end)
          )
        );
      } else {
        updateArrows(currentNode.key, [...currentArrows, arrow]);
      }
    },
    [currentNode, updateArrows]
  );

  const onMarkSquare = useCallback(
    (markedSquare: MarkedSquare) => {
      if (!currentNode) return;
      const currentMarkedSquares = currentNode.data.markedSquares || [];
      if (currentMarkedSquares.some((cur: MarkedSquare) => cur.square === markedSquare.square)) {
        updateMarkedSquares(
          currentNode.key,
          currentMarkedSquares.filter((cur: MarkedSquare) => cur.square !== markedSquare.square)
        );
      } else {
        updateMarkedSquares(currentNode.key, [...currentMarkedSquares, markedSquare]);
      }
    },
    [currentNode, updateMarkedSquares]
  );

  const onClear = useCallback(() => {
    if (!currentNode) return;
    clearMarkup(currentNode.key);
  }, [currentNode, clearMarkup]);
  const [arrowColor, setArrowColor] = useState<ArrowColor>("G");

  return {
    tree: variationTree,
    loadPgn,
    moveText,
    pgn,
    mainLine,
    rootNodes: variationTree.treeArray,
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
    markupControls: {
      onClear,
      onArrow,
      onMarkSquare,
      arrowColor,
      setArrowColor,
    },
  };
}

import { useCallback, useEffect, useMemo, useState, useRef, useContext } from "react";
import { SettingsContext } from "@/context/settings";
import useSound from "use-sound";
import useVariationTree, { VariationTree } from "./useVariationTree";
import useEvaler, { Evaler } from "./useEvaler";

import useOpeningExplorer, { ExplorerHook } from "./useOpeningExplorer";
import * as Chess from "@/lib/chess";
import _, { set } from "lodash";

import { PGNTagData, AnalysisData, ArrowColor, MarkedSquare, Arrow, TreeNode } from "@/lib/types";
type Node = TreeNode<Chess.NodeData>;

export interface AnalysisHook {
  isNew: boolean;
  tree: VariationTree;
  treeId: string | null;
  loadPgn: (pgn: string, id?: string) => void;
  pgnLoaded: boolean;
  pgn: string;
  exportPgn: (options: {
    includeVariations: boolean;
    includeComments: boolean;
    annotate: boolean;
    includeNags: boolean;
    includeTimeRemaining: boolean;
    includeArrows: boolean;
    initialMoveCount: number;
  }) => string;
  tagData: PGNTagData;
  setTagData: React.Dispatch<React.SetStateAction<PGNTagData>>;
  currentKey: string | null;
  currentNode: Node | null;
  moveText: string;
  mainLine: Node[];
  rootNodes: Node[];
  currentGame: Chess.Game;
  onMove: (move: Chess.Move) => void;
  evaler: Evaler;
  evalEnabled: boolean;
  timeRemaining: Record<Chess.Color, number | null>;
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
  explorer: ExplorerHook;
  setMoveQueue: React.Dispatch<React.SetStateAction<string[]>>;
  commentControls: {
    updateComment: (nodeId: string, comment: string) => void;
    updateAnnotations: (nodeId: string, annotations: number[]) => void;
    updateTimeRemaining: (nodeId: string, timeRemaining: number | null) => void;
  };
  markupControls: {
    onArrow: (arrow: Arrow) => void;
    onMarkSquare: (square: MarkedSquare) => void;
    onClear: () => void;
    arrowColor: ArrowColor;
    setArrowColor: (color: ArrowColor) => void;
  };
  loadFen: (fen: string) => void;
  reset: (options: { pgn?: string | undefined }) => void;
  setOptions: React.Dispatch<React.SetStateAction<AnalysisOptions>>;
}

interface AnalysisOptions {
  startPosition: string;
  initialTree?: TreeNode<Chess.NodeData>[];
  pgnSource?: string;
  evalEnabled: boolean;
  id?: string;
  readonly: boolean;
  isNew?: boolean;
}
const defaultOptions = {
  startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  evalEnabled: true,
  readonly: false,
};

import { parsePgn, tagDataToPGNString } from "@/util/parsers/pgnParser";

export default function useAnalysisBoard(initialOptions?: Partial<AnalysisOptions>): AnalysisHook {
  const [isNew, setIsNew] = useState(
    () => (!initialOptions?.id && !initialOptions?.pgnSource && initialOptions?.isNew) as boolean
  );
  const [options, setOptions] = useState(() => {
    return { ...defaultOptions, ...initialOptions };
  });
  const { settings } = useContext(SettingsContext);
  const [evalEnabled, setEvalEnabled] = useState(() => options.evalEnabled);
  const [tagData, setTagData] = useState<PGNTagData>({});
  const pgnLoadedRef = useRef(true);
  const [pgnToLoad, setPgnToLoad] = useState<string | null>(null);
  useEffect(() => {
    if (options.startPosition !== defaultOptions.startPosition) setIsNew(false);
    if (options.pgnSource) setIsNew(false);
  }, [isNew, options]);
  // Game to return if no current node
  const initialGame = useMemo<Chess.Game>(() => {
    const game = Chess.createGame({
      startPosition: options.startPosition,
      timeControl: null,
    });
    return game;
  }, [options.startPosition]);

  // Initial tree from pgn
  const initialTree = useMemo(() => {
    if (options.pgnSource) {
      try {
        const { tree, tagData } = parsePgn(options.pgnSource);
        if (tagData.fen)
          setOptions((cur) => {
            return { ...cur, startPosition: tagData.fen || defaultOptions.startPosition };
          });
        return tree;
      } catch (e) {
        return [];
      }
    }
  }, [options.pgnSource, options.startPosition]);

  // Variation tree
  const variationTree = useVariationTree({
    initialTree,
    initialMoveCount: initialGame.fullMoveCount - 1 + (initialGame.activeColor === "w" ? 0 : 1),
  });
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
    treeId,
  } = variationTree;

  const currentLine = useMemo(() => {
    return [...path, ...continuation];
  }, [path, continuation]);

  //Reset analysis
  const reset = (options: { pgn?: string }) => {
    variationTree.setTreeId(null);
    if (options.pgn) {
      const { tree, tagData } = parsePgn(options.pgn);
      loadPgn(options.pgn);
      setTagData(tagData);
      setIsNew(false);
    } else {
      setOptions((cur) => {
        return { ...cur, startPosition: defaultOptions.startPosition };
      });
      variationTree.loadNewTree([]);
      setTagData({});
      setIsNew(true);
    }
  };
  // Load pgn to tree
  const loadPgn = (pgn: string, id?: string) => {
    pgnLoadedRef.current = false;
    setPgnToLoad(pgn);
    try {
      const { tree, tagData } = parsePgn(pgn);
      setOptions((cur) => {
        return { ...cur, startPosition: tagData.fen || defaultOptions.startPosition };
      });

      // Dont assign unknown values
      setTagData({
        event: tagData.event === "?" ? undefined : tagData.event,
        site: tagData.site === "?" ? undefined : tagData.site,
        date: tagData.date === "????.??.??" ? undefined : tagData.date,
        round: tagData.round === "?" ? undefined : tagData.round,
        ...tagData,
      });
      variationTree.loadNewTree(tree, id);
      setIsNew(false);
    } catch (e) {
      console.error(e);
    }
  };

  const loadFen = useCallback(
    (fen: string) => {
      const valid = Chess.validateFen(fen);
      if (valid !== true) {
        alert(`${valid}`);
        return;
      }
      if (fen !== options.startPosition) {
        //clear variation tree
        variationTree.loadNewTree([]);
        if (fen !== defaultOptions.startPosition) {
          setTagData((cur) => ({ ...cur, fen, setUp: "1" }));
        }
        setOptions((cur) => {
          return { ...cur, startPosition: fen };
        });
      }
      setIsNew(false);
    },
    [variationTree, options.startPosition, tagData]
  );

  // Step forward/backward with arrow keys
  useEffect(() => {
    // Check if an input or textarea is focused
    const isInputFocused = () => {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
        return true;
      }
      return false;
    };
    const arrowKeyHandler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;
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

  // Current game from current node
  const currentGame = useMemo<Chess.Game>(() => {
    if (currentNode === null) return initialGame;
    return Chess.gameFromNodeData(
      currentNode.data,
      options.startPosition,
      path.map((node) => node.data)
    );
  }, [currentNode, initialGame, options.startPosition, path]);

  const timeRemaining = useMemo(() => {
    let result: Record<Chess.Color, number | null> = { w: null, b: null };
    if (currentNode === null) {
      const activeColor = initialGame.activeColor;
      const nextNode = continuation[0];
      if (nextNode?.data.timeRemaining) {
        result[activeColor] = nextNode.data.timeRemaining;
      }
      const followingNode = continuation[1];
      if (followingNode?.data.timeRemaining) {
        result[activeColor === "w" ? "b" : "w"] = followingNode.data.timeRemaining;
      }
    }
    if (currentNode?.data.timeRemaining) {
      result[currentGame.activeColor === "w" ? "b" : "w"] = currentNode.data.timeRemaining;
    }
    const previousNode = path[path.length - 2];
    if (previousNode?.data.timeRemaining) {
      result[currentGame.activeColor] = previousNode.data.timeRemaining;
    } else {
      const nextNode = continuation[0];
      if (nextNode?.data.timeRemaining) {
        result[currentGame.activeColor] = nextNode.data.timeRemaining;
      }
    }
    return result;
  }, [currentNode, currentGame, path, initialGame, continuation]);

  // PGN string from current variation tree
  const pgn = useMemo(() => {
    const tagSection = tagDataToPGNString(tagData);
    return tagSection + "\r\n" + moveText + (tagData?.result || "*");
  }, [moveText, tagData]);

  // Export pgn
  const exportPgn = useCallback(
    (options: {
      includeVariations: boolean;
      includeComments: boolean;
      annotate: boolean;
      includeNags: boolean;
      includeTimeRemaining: boolean;
      includeArrows: boolean;
      initialMoveCount: number;
    }) => {
      const text = variationTree.exportMoveText(options);
      const tagSection = tagDataToPGNString(tagData);
      return tagSection + "\r\n" + text + (tagData?.result || "*");
    },
    [moveText, tagData]
  );

  useEffect(() => {
    pgnLoadedRef.current = true;
    setPgnToLoad(null);
  }, [pgn]);

  // Opening explorer and evaler
  const explorer = useOpeningExplorer(currentGame);
  const evaler = useEvaler(currentGame.fen, !evalEnabled);

  //Move sounds
  const moveVolume = useMemo(() => {
    if (!settings.sound.moveSounds) return 0;
    return settings.sound.volume / 100;
  }, [settings.sound.volume, settings.sound.moveSounds]);
  const [playMove] = useSound("/assets/sounds/move.wav", { volume: moveVolume });
  const [playCapture] = useSound("/assets/sounds/capture.wav", {
    volume: moveVolume,
  });
  const [playCastle] = useSound("/assets/sounds/castle.wav", {
    volume: moveVolume,
  });
  const lastMove = currentGame.lastMove;
  useEffect(() => {
    if (lastMove && settings.sound.moveSounds) {
      if (lastMove.capture) playCapture();
      else if (lastMove.isCastle) playCastle();
      else playMove();
    }
  }, [lastMove, playMove, playCapture, playCastle]);

  // Update comments, annotations, arrows, etc. on current node
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

  const updateTimeRemaining = useCallback(
    (nodeId: string, timeRemaining: number | null) => {
      const node = variationTree.tree.getNode(nodeId);
      if (!node) return;
      variationTree.tree.updateNode(nodeId, {
        timeRemaining: timeRemaining || undefined,
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

  const onMove = useCallback(
    (move: Chess.Move) => {
      if (isNew) setIsNew(false);
      const existingMoveKey = variationTree.findNextMove(Chess.MoveToUci(move));
      if (existingMoveKey) {
        variationTree.setCurrentKey(existingMoveKey);
      } else {
        const halfMoveCount = variationTree.path.length + (initialGame.activeColor === "w" ? 1 : 2);
        const nodeToInsert = Chess.nodeDataFromMove(currentGame, move, halfMoveCount);
        variationTree.addMove(nodeToInsert);
      }
    },
    [currentGame, variationTree, initialGame]
  );

  const jumpForward = useCallback(() => {
    const node = currentLine[currentLine.length - 1];
    setCurrentKey(node?.key || null);
  }, [currentLine]);

  const jumpBackward = () => {
    setCurrentKey(null);
  };

  const [moveQueue, setMoveQueue] = useState<string[]>([]);
  const prevGame = useRef<Chess.Game>();

  useEffect(() => {
    if (_.isEqual(prevGame.current, currentGame)) {
      console.log("Game hasn't updated");
      return;
    } //"don't execute if a the game hasn't updated"
    if (!moveQueue.length) return;
    prevGame.current = currentGame;
    const move = currentGame.legalMoves.find((move) => move.PGN === moveQueue[0]);
    if (move) {
      setTimeout(() => {
        onMove(move);
        setMoveQueue((cur) => cur.slice(1));
      }, 200);
    } else {
      setMoveQueue([]);
      console.error("Invalid move in move queue");
      console.error(moveQueue[0]);
    }
  }, [moveQueue, currentGame, onMove, prevGame, moveQueue.length]);

  // Arrow and square marking callbacks
  const onArrow = useCallback(
    (arrow: Arrow) => {
      if (!currentNode) return;
      const currentArrows = currentNode.data.arrows || [];
      if (currentArrows.some((cur: Arrow) => cur.start === arrow.start && cur.end === arrow.end)) {
        updateArrows(
          currentNode.key,
          currentArrows.filter((cur: Arrow) => !(cur.start === arrow.start && cur.end === arrow.end))
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
    reset,
    isNew,
    tree: variationTree,
    treeId,
    loadPgn,
    pgnLoaded: pgnLoadedRef.current,
    exportPgn,
    loadFen,
    moveText,
    pgn,
    tagData,
    setTagData,
    mainLine,
    timeRemaining,
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
    explorer,
    setOptions,
    commentControls: {
      updateComment,
      updateAnnotations,
      updateTimeRemaining,
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

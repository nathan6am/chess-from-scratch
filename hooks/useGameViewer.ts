import { useCallback, useEffect, useMemo, useState, useRef, useContext } from "react";
import { SettingsContext } from "@/context/settings";
import useSound from "use-sound";
import useVariationTree from "./useVariationTree";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import { PGNTagData, TreeNode } from "@/lib/types";
import { ApiResponse } from "./useOpeningExplorer";

type Node = TreeNode<Chess.NodeData>;
export interface AnalysisData {
  title: string;
  description?: string;
  collectionIds: string[];
  tags: string[];
  visibility: "private" | "unlisted" | "public";
}
export interface ReplayHook {
  tagData: PGNTagData | undefined;
  currentKey: string | null;
  currentNode: Node | null;
  mainLine: Node[];
  rootNodes: Node[];
  currentGame: Chess.Game;
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
}
import { parsePgn } from "@/util/parsers/pgnParser";

interface Params {
  pgn: string;
  startFromEnd?: boolean;
}

export default function useGameViewer({ pgn }: { pgn: string }): ReplayHook {
  const { settings } = useContext(SettingsContext);
  const { tagData, tree } = useMemo(() => {
    try {
      return parsePgn(pgn);
    } catch {
      return { tree: [], tagData: {} };
    }
  }, [pgn]);

  const startPosition = useMemo(
    () => tagData.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    [tagData]
  );
  const initialGame = useMemo<Chess.Game>(() => {
    const game = Chess.createGame({
      startPosition,
      timeControl: null,
    });
    return game;
  }, [pgn]);
  const variationTree = useVariationTree();
  useEffect(() => {
    variationTree.loadNewTree(tree);
  }, [tree]);
  const { currentNode, path, continuation, stepBackward, stepForward, currentKey, moveText, mainLine, setCurrentKey } =
    variationTree;

  const currentGame = useMemo<Chess.Game>(() => {
    if (currentNode === null) return initialGame;
    return Chess.gameFromNodeData(
      currentNode.data,
      startPosition,
      path.map((node) => node.data)
    );
  }, [currentNode, initialGame, startPosition, path]);
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

  const currentNodeKey = useRef<string | null>();

  const currentLine = useMemo(() => {
    return [...path, ...continuation];
  }, [path, continuation]);

  const jumpForward = useCallback(() => {
    const node = currentLine[currentLine.length - 1];
    setCurrentKey(node?.key || null);
  }, [currentLine]);

  const jumpBackward = () => {
    setCurrentKey(null);
  };
  return {
    tagData,
    mainLine,
    rootNodes: variationTree.rootNodes,
    currentGame,
    boardControls: { stepBackward, stepForward, jumpBackward, jumpForward },
    variations: variationTree.treeArray,
    setCurrentKey,
    currentLine,
    path,
    currentKey,
    currentNode,
  };
}

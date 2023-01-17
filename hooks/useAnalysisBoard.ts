import useVariationTree from "./useVariationTree";
import * as Chess from "@/util/chess";
import { useCallback, useEffect, useMemo } from "react";
import useLocalEval from "./useLocalEval";

export default function useAnalysisBoard(startFen: string) {
  const evaler = useLocalEval();
  const initialGame = useMemo<Chess.Game>(() => {
    const game = Chess.createGame({
      startPosition: startFen,
      timeControls: null,
    });
    return game;
  }, []);
  const variationTree = useVariationTree();

  const { currentNodeData, path, onStepBackward, onStepForward, continuation } = variationTree;

  const currentGame = useMemo<Chess.Game>(() => {
    if (currentNodeData === null) return initialGame;
    return Chess.gameFromNodeData(
      currentNodeData,
      path.map((node) => node.data)
    );
  }, [currentNodeData, initialGame]);
  useEffect(() => {
    if (evaler.isReady) {
      evaler.getEvaluation(currentGame.fen);
    }
  }, [evaler.isReady]);
  const onMove = useCallback(
    (move: Chess.Move) => {
      const existingMoveKey = variationTree.findNextMove(Chess.MoveToUci(move));
      if (existingMoveKey) {
        const next = variationTree.setCurrentKey(existingMoveKey);
        if (next) evaler.getEvaluation(next.data.fen);
      } else {
        const currentMoveCount: [number, 0 | 1] = currentNodeData ? currentNodeData.moveCount : [0, 1];
        const nodeToInsert = Chess.nodeDataFromMove(currentGame, move, currentMoveCount);
        variationTree.addMove(nodeToInsert);
        evaler.getEvaluation(nodeToInsert.fen);
      }
    },
    [currentGame, variationTree]
  );

  const stepForward = () => {
    const next = onStepForward();
    if (next) evaler.getEvaluation(next.data.fen);
  };

  const stepBackward = () => {
    const prev = onStepBackward();
    if (prev) evaler.getEvaluation(prev.data.fen);
  };
  return {
    currentGame,
    onMove,
    evaluation: evaler.evaluation,
    stepBackward,
    stepForward,
    variations: variationTree.treeArray,
    wasm: evaler.wasmSupported,
  };
}

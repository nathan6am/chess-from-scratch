import useVariationTree from "./useVariationTree";
import * as Chess from "@/util/chess";
import { useCallback, useMemo } from "react";
import useLocalEval from "./useLocalEval";
import { getEvaluation } from "@/util/chess";

export default function useAnalysisBoard(startFen: string) {
  const evaler = useLocalEval();
  const initialGame = useMemo<Chess.Game>(() => {
    const game = Chess.createGame({ startPosition: startFen, timeControls: null });
    return game;
  }, []);
  const variationTree = useVariationTree();
  const { currentNode, path, stepBackward, stepForward } = variationTree;
  const currentGame = useMemo<Chess.Game>(() => {
    if (currentNode === null) return initialGame;
    return Chess.gameFromNode(currentNode, path);
  }, [currentNode, initialGame]);

  const onMove = useCallback(
    (move: Chess.Move) => {
      const existingMoveKey = variationTree.getNextMoveKey(Chess.MoveToUci(move));
      if (existingMoveKey) {
        variationTree.jumpToNodeByKey(existingMoveKey);
      } else {
        const currentMoveCount: [number, 0 | 1] = currentNode ? currentNode.moveCount : [0, 1];
        const nodeToInsert = Chess.nodeFromMove(currentGame, move, currentMoveCount);
        console.log(nodeToInsert);
        variationTree.insertNode(nodeToInsert);
        evaler.getEvaluation(nodeToInsert.fen);
      }
    },
    [currentGame, variationTree]
  );

  const onStepForward = () => {
    const next = stepForward();
    if (next && next.fen) evaler.getEvaluation(next.fen);
  };

  const onStepBackward = () => {
    const prev = stepBackward();
    if (prev) evaler.getEvaluation(prev.fen);
  };
  return {
    currentGame,
    onMove,
    evaluation: evaler.evaluation,
    onStepBackward,
    onStepForward,
  };
}

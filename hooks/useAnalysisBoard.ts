import useVariationTree from "./useVariationTree";
import * as Chess from "@/lib/chess";
import useSound from "use-sound";

import { useCallback, useEffect, useMemo } from "react";
import useLocalEval from "./useLocalEval";
import useDebounce from "./useDebounce";
import _ from "lodash";
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

  const {
    currentNodeData,
    path,
    continuation,
    onStepBackward,
    onStepForward,
    currentKey,
    pgn,
    mainLine,
    setCurrentKey,
  } = variationTree;
  const [playMove] = useSound("/assets/sounds/move.wav");
  const [playCapture] = useSound("/assets/sounds/capture.wav");
  const currentGame = useMemo<Chess.Game>(() => {
    if (currentNodeData === null) return initialGame;
    return Chess.gameFromNodeData(
      currentNodeData,
      path.map((node) => node.data)
    );
  }, [currentNodeData, initialGame]);
  const lastMove = currentGame.lastMove;
  useEffect(() => {
    if (lastMove) {
      if (lastMove.capture) playCapture();
      else playMove();
    }
  }, [lastMove, playMove, playCapture]);

  //Debounce fen change for evaler/api requests
  const debouncedFen = useDebounce(currentGame.fen, 600);
  useEffect(() => {
    if (evaler.isReady) {
      console.log(debouncedFen);
      evaler.getEvaluation(debouncedFen);
    }
  }, [evaler.isReady, debouncedFen]);

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

  const stepForward = () => {
    const next = onStepForward();
    //if (next) evaler.getEvaluation(next.data.fen);
  };

  const stepBackward = () => {
    const prev = onStepBackward();
    //if (prev) evaler.getEvaluation(prev.data.fen);
  };
  return {
    pgn,
    mainLine,
    currentGame,
    onMove,
    evaler,
    stepBackward,
    stepForward,
    variations: variationTree.treeArray,
    setCurrentKey,
    currentLine,
    path,
    currentKey,
    currentNodeData,
  };
}

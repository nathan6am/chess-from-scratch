import React, { useCallback, useEffect, useState } from "react";
import useChessLocal from "@/hooks/useChessLocal";
import Board from "@/components/Game/Board";
import EvalBar from "./Game/EvalBar";
import * as Chess from "@/util/chess";
import _ from "lodash";
import useStockfish from "@/hooks/useStockfish";
import MoveHistory from "@/components/Game/MoveHistory";
import { positionToBoard } from "@/util/chess";
import useLocalEval from "@/hooks/useLocalEval";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";
export default function GameLocal() {
  const { currentGame, onMove, evaluation, stepForward, stepBackward } =
    useAnalysisBoard(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );
  const [orientation, setOrientation] = useState<Chess.Color>("w");

  return (
    <div className="flex flex-col h-full w-full justify-center">
      <p>eval: {evaluation && evaluation.score?.value}</p>
      <p>depth: {evaluation && evaluation.depth}</p>
      <div className="flex flex-row items-center">
        <EvalBar
          scoreType={evaluation?.score?.type || "cp"}
          value={evaluation?.score?.value || 0}
          orientation={orientation}
          scale={9.06}
          key={orientation}
        />
        <Board
          orientation={orientation}
          legalMoves={currentGame.legalMoves}
          showHighlights={true}
          showTargets={true}
          pieces={currentGame.board}
          animationSpeed="normal"
          lastMove={currentGame.lastMove}
          activeColor={currentGame.activeColor}
          moveable={"both"}
          preMoveable={false}
          autoQueen={true}
          onMove={onMove}
          onPremove={() => {}}
        />
      </div>
    </div>
  );
}

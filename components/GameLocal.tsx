import React, { useCallback, useEffect, useState } from "react";
import useChessLocal from "@/hooks/useChessLocal";
import Board from "@/components/game/Board";
import EvalBar from "./game/EvalBar";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import useStockfish from "@/hooks/useStockfish";
import MoveHistory from "@/components/game/MoveHistory";
import useLocalEval from "@/hooks/useLocalEval";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";
export default function GameLocal() {
  const { currentGame, onMove, evaluation, stepForward, stepBackward, wasm } =
    useAnalysisBoard(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );
  const [orientation, setOrientation] = useState<Chess.Color>("w");

  return (
    <div className="flex flex-col h-full w-full justify-center">
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

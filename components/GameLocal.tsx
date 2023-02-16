import React, { useCallback, useEffect, useState } from "react";
import useChessLocal from "@/hooks/useChessLocal";
import Board from "@/components/game/Board";
import EvalBar from "./analysis/EvalBar";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import useStockfish from "@/hooks/useStockfish";
import MoveHistory from "@/components/game/MoveHistory";
import useLocalEval from "@/hooks/useLocalEval";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";
import VarationTree from "./analysis/VarationTree";
export default function GameLocal() {
  const [orientation, setOrientation] = useState<Chess.Color>("w");

  return (
    <div className="flex flex-col h-full w-full justify-center">
      <div className="flex flex-row items-center"></div>
    </div>
  );
}

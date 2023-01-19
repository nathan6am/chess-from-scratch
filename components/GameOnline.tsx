import React, { useEffect, useState } from "react";
import useChessLocal from "@/hooks/useChessLocal";
import Board from "@/components/Game/Board";
import EvalBar from "./Game/EvalBar";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import MoveHistory from "@/components/Game/MoveHistory";
import useLocalEval from "@/hooks/useLocalEval";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";
import useChessOnline from "@/hooks/useChessOnline";
interface Props {
  lobbyid: string;
}

export default function GameOnline({ lobbyid }: Props) {
  const {
    game,
    gameActive,
    onMove,
    connected,
    playerColor,
    timeRemaining,
    controls,
    moveable,
    currentBoard,
    livePositionOffset,
    lastMove,
  } = useChessOnline(lobbyid);
  const [orientation, setOrientation] = useState<Chess.Color>(playerColor || "w");
  useEffect(() => {
    if (playerColor) setOrientation(playerColor);
  }, [playerColor]);
  if (!game || !gameActive) return <div>waiting</div>;

  const currentGame = game.data;
  return (
    <div className="flex flex-col h-full w-full justify-center">
      <div className="flex flex-row items-center">
        <Board
          orientation={orientation}
          legalMoves={currentGame.legalMoves}
          showHighlights={true}
          showTargets={true}
          pieces={currentBoard || currentGame.board}
          animationSpeed="normal"
          lastMove={lastMove}
          activeColor={currentGame.activeColor}
          moveable={moveable ? playerColor || "none" : "none"}
          preMoveable={false}
          autoQueen={true}
          onMove={onMove}
          onPremove={() => {}}
        />
        <MoveHistory
          currentOffset={livePositionOffset}
          orientation={orientation}
          timeRemaining={timeRemaining}
          controls={controls}
          moveHistory={currentGame.moveHistory}
          usePieceIcons={true}
          onFlipBoard={() => {
            setOrientation((cur) => (cur === "w" ? "b" : "w"));
          }}
        />
      </div>
    </div>
  );
}

import React, { useEffect, useState, useMemo } from "react";
import useChessLocal from "@/hooks/useChessLocal";
import Board from "@/components/game/Board";
import EvalBar from "./game/EvalBar";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import MoveHistory from "@/components/game/MoveHistory";
import useLocalEval from "@/hooks/useLocalEval";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";
import Result from "@/components/UI/dialogs/Result";
import useChessOnline from "@/hooks/useChessOnline";
import Waiting from "./game/Waiting";
interface Props {
  lobbyid: string;
}
import PlayerCard from "./game/PlayerCard";
import styles from "@/styles/Board.module.scss";
import { Player } from "@/server/types/lobby";
export default function GameOnline({ lobbyid }: Props) {
  const {
    lobby,
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
  const players = useMemo(() => {
    let result: Record<Chess.Color, Player | undefined> = {
      w: undefined,
      b: undefined,
    };
    if (!lobby || !game) return result;
    result.w = lobby.players.find((player) => player.id === game.players.w);
    result.b = lobby.players.find((player) => player.id === game.players.b);
    console.log(game.players.b);
    return result;
  }, [lobby, game]);
  useEffect(() => {
    if (playerColor) setOrientation(playerColor);
  }, [playerColor]);
  if (!game || !gameActive) return <Waiting lobbyUrl={`${process.env.NEXT_PUBLIC_BASE_URL}/play/${lobbyid}`} />;

  const currentGame = game.data;
  return (
    <div className="flex flex-col h-full w-full justify-center">
      <Result outcome={game.data.outcome} isOpen={false} close={() => {}} />
      <div className="flex flex-row h-full w-full items-center justify-center py-6 lg:py-10">
        <div className="flex flex-col h-full grow justify-start lg:justify-center items-center">
          <div className={`w-full ${styles.boardColumn}`}>
            <div className={`${orientation === "w" ? "flex-col" : "flex-col-reverse"} w-full`}>
              {players.b && <PlayerCard player={players.b} connectionStatus={true} />}
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
              {players.w && <PlayerCard player={players.w} connectionStatus={true} />}
            </div>

            <div className="min-h-[200px] w-full bg-red-400 lg:hidden"></div>
          </div>
        </div>
        <div className="h-full hidden lg:block">
          <MoveHistory
            currentOffset={livePositionOffset}
            orientation={orientation}
            timeRemaining={timeRemaining}
            controls={controls}
            moveHistory={currentGame.moveHistory}
            usePieceIcons={false}
            onFlipBoard={() => {
              setOrientation((cur) => (cur === "w" ? "b" : "w"));
            }}
          />
        </div>
      </div>
    </div>
  );
}

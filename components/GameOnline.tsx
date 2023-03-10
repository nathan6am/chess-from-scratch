import React, { useEffect, useState, useMemo } from "react";
import Board from "@/components/game/Board";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import Result from "@/components/UI/dialogs/Result";
import useChessOnline, { BoardControls as IBoardControls, GameControls as IGameControls } from "@/hooks/useChessOnline";
import BoardControls from "./game/BoardControls";
import Waiting from "./game/Waiting";

import Clock from "./game/Clock";
import PlayerCard from "./game/PlayerCard";
import { Connection, Player } from "@/server/types/lobby";
import { BoardColumn, BoardRow, PanelColumn, PanelContainer } from "./layout/GameLayout";
import { DurationObjectUnits } from "luxon";
import GameControls from "./game/GameControls";
import MoveHistory, { MoveTape } from "./game/MoveHistory";

interface Props {
  lobbyid: string;
}
export default function GameOnline({ lobbyid }: Props) {
  const onlineGame = useChessOnline(lobbyid);
  const {
    currentGame,
    currentBoard,
    timeRemaining,
    playerColor,
    lobby,
    lastMove,
    moveable,
    gameControls,
    boardControls,
    livePositionOffset,
  } = onlineGame;
  const [orientation, setOrientation] = useState<Chess.Color>(playerColor || "w");
  const players = useMemo(() => {
    let result: Record<Chess.Color, Connection | undefined> = {
      w: undefined,
      b: undefined,
    };
    if (!lobby || !currentGame) return result;
    result.w = lobby.connections.find((player) => player.id === currentGame.players.w.id);
    result.b = lobby.connections.find((player) => player.id === currentGame.players.b.id);

    return result;
  }, [lobby, currentGame]);

  //Set the board orientation if the player color changes
  useEffect(() => {
    if (playerColor) setOrientation(playerColor);
  }, [playerColor]);

  if (!onlineGame.connectionStatus.lobby) {
    return <div>Connecting...</div>;
  }
  //TODO: Add connecting component
  if (!currentGame) return <Waiting lobbyUrl={`${process.env.NEXT_PUBLIC_BASE_URL}/play/${lobbyid}`} />;

  const gameData = currentGame.data;
  return (
    <div className="flex flex-col h-full w-screen justify-center">
      <Result outcome={gameData.outcome} isOpen={gameData.outcome ? true : false} close={() => {}} />
      <BoardRow>
        <BoardColumn>
          <div className="w-full lg:hidden">
            <MoveTape
              moveHistory={gameData.moveHistory}
              jumpToOffset={boardControls.jumpToOffset}
              currentOffset={livePositionOffset}
              usePieceIcons={true}
            />
          </div>
          <div className={`flex ${orientation === "w" ? "flex-col" : "flex-col-reverse"} w-full`}>
            <div className="flex flex-row w-full justify-between">
              {players.b && <PlayerCard connection={players.b} />}
              <Clock timeRemaining={timeRemaining.b} color="b" size="sm" className="lg:hidden" />
            </div>

            <Board
              movementType="both"
              theme="blue"
              pieceSet="maestro"
              orientation={orientation}
              legalMoves={gameData.legalMoves}
              showHighlights={true}
              showTargets={true}
              pieces={currentBoard || gameData.board}
              animationSpeed="normal"
              lastMove={lastMove}
              activeColor={gameData.activeColor}
              moveable={moveable ? playerColor || "none" : "none"}
              preMoveable={false}
              autoQueen={true}
              onMove={gameControls.onMove}
              onPremove={() => {}}
            />
            <div className="flex flex-row w-full justify-between">
              {players.w && <PlayerCard connection={players.w} />}
              <Clock timeRemaining={timeRemaining.w} color="w" size="sm" className="lg:hidden" />
            </div>
          </div>

          <div className="min-h-[120px] w-full block lg:hidden">
            <BoardControls controls={boardControls} />
            <GameControls
              size="sm"
              className="bg-white/[0.1]"
              gameControls={gameControls}
              flipBoard={() => {
                setOrientation((cur) => (cur === "w" ? "b" : "w"));
              }}
            />
          </div>
        </BoardColumn>
        <PanelColumn>
          <PanelOnline
            timeRemaining={timeRemaining}
            boardControls={boardControls}
            gameControls={gameControls}
            flipBoard={() => {
              setOrientation((cur) => (cur === "w" ? "b" : "w"));
            }}
            currentOffset={livePositionOffset}
            moveHistory={gameData.moveHistory}
            orientation={orientation}
          />
        </PanelColumn>
      </BoardRow>
    </div>
  );
}

interface PanelProps {
  timeRemaining: Record<Chess.Color, DurationObjectUnits>;
  boardControls: IBoardControls;
  gameControls: IGameControls;
  flipBoard: () => void;
  moveHistory: Chess.MoveHistory;
  currentOffset: number;
  orientation: Chess.Color;
}
function PanelOnline({
  timeRemaining,
  boardControls,
  gameControls,
  moveHistory,
  flipBoard,
  currentOffset,
  orientation,
}: PanelProps) {
  return (
    <div className={`flex ${orientation === "w" ? "flex-col" : "flex-col-reverse"} w-full h-full`}>
      <Clock color="b" timeRemaining={timeRemaining.b} size="lg" className="my-4" />
      <PanelContainer>
        <GameControls gameControls={gameControls} flipBoard={flipBoard} size="lg" />
        <MoveHistory
          moveHistory={moveHistory}
          jumpToOffset={boardControls.jumpToOffset}
          currentOffset={currentOffset}
          usePieceIcons={true}
        />
        <BoardControls controls={boardControls} />
      </PanelContainer>
      <Clock color="w" timeRemaining={timeRemaining.w} size="lg" className="my-4" />
    </div>
  );
}

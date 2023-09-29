import React, { useEffect, useState, useMemo, useContext } from "react";
import Board from "@/components/game/Board";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import Result from "@/components/UI/dialogs/Result";
import useChessOnline, {
  BoardControls as IBoardControls,
  GameControls as IGameControls,
} from "@/hooks/useChessOnline";
import BoardControls from "./game/BoardControls";
import Waiting from "./game/Waiting";
import { SettingsContext } from "@/context/settings";
import Clock from "./game/Clock";
import PlayerCard from "./game/PlayerCard";
import { Connection, Player } from "@/server/types/lobby";
import {
  BoardColumn,
  BoardRow,
  PanelColumn,
  PanelColumnLg,
  PanelContainer,
} from "./layout/GameLayout";
import { DurationObjectUnits } from "luxon";
import GameControls from "./game/GameControls";
import MoveHistory, { MoveTape } from "./game/MoveHistory";

interface Props {
  lobbyid: string;
}

interface GameDetails {
  players: Record<Chess.Color, Connection | undefined>;
  timeControl: Chess.TimeControl | undefined | null;
  ratingCategory: Chess.RatingCategory | undefined | null;
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
  const { settings } = useContext(SettingsContext);
  const timeControl = currentGame?.data.config.timeControl;
  const ratingCategory = currentGame?.ratingCategory;
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
  const gameDetails: GameDetails = {
    players: players,
    timeControl: timeControl,
    ratingCategory: ratingCategory,
  };
  //Set the board orientation if the player color changes
  useEffect(() => {
    if (playerColor) setOrientation(playerColor);
  }, [playerColor]);

  if (!onlineGame.connectionStatus.lobby) {
    return <div>Connecting...</div>;
  }
  //TODO: Add connecting component
  if (!currentGame)
    return <Waiting lobbyUrl={`${process.env.NEXT_PUBLIC_BASE_URL}/play/${lobbyid}`} />;

  const gameData = currentGame.data;
  return (
    <div className="flex flex-col h-full w-full justify-center">
      <Result
        outcome={gameData.outcome}
        isOpen={gameData.outcome ? true : false}
        close={() => {}}
      />
      <BoardRow>
        <div className="flex flex-row w-full lg:h-fit lg:basis-[100vh] justify-center">
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
                <Clock timeRemaining={timeRemaining.b} color="b" size="sm" />
              </div>

              <Board
                showCoordinates={settings.display.showCoordinates}
                movementType={settings.gameBehavior.movementType}
                theme={settings.display.boardTheme}
                pieceSet={settings.display.pieceTheme}
                orientation={orientation}
                legalMoves={gameData.legalMoves}
                showHighlights={true}
                showTargets={true}
                pieces={currentBoard || gameData.board}
                animationSpeed={settings.display.animationSpeed}
                lastMove={lastMove}
                activeColor={gameData.activeColor}
                moveable={moveable ? playerColor || "none" : "none"}
                preMoveable={settings.gameBehavior.allowPremoves}
                autoQueen={settings.gameBehavior.autoQueen}
                onMove={gameControls.onMove}
                onPremove={() => {}}
              />
              <div className="flex flex-row w-full justify-between">
                {players.w && <PlayerCard connection={players.w} />}
                <Clock timeRemaining={timeRemaining.w} color="w" size="sm" />
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
        </div>
        <PanelColumnLg>
          <PanelOnline
            gameDetails={gameDetails}
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
        </PanelColumnLg>
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
  gameDetails: GameDetails;
}
function PanelOnline({
  gameDetails,
  boardControls,
  gameControls,
  moveHistory,
  flipBoard,
  currentOffset,
  orientation,
}: PanelProps) {
  return (
    <PanelContainer>
      <div className="w-full p-4 bg-elevation-2">
        <p>
          {`Unrated ${gameDetails.ratingCategory} game`}
          <span className="text-light-300">
            {gameDetails.timeControl
              ? ` (${gameDetails.timeControl.timeSeconds / 60} + ${
                  gameDetails.timeControl.incrementSeconds
                })`
              : ""}
          </span>
        </p>
      </div>
      <MoveHistory
        moveHistory={moveHistory}
        jumpToOffset={boardControls.jumpToOffset}
        currentOffset={currentOffset}
        usePieceIcons={true}
      />
      <BoardControls controls={boardControls} flipBoard={flipBoard} />
      <GameControls gameControls={gameControls} flipBoard={flipBoard} size="lg" />
    </PanelContainer>
  );
}

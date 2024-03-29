import React, { useEffect, useState, useMemo, useContext } from "react";
import Board from "@/components/board/Board";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import Result from "@/components/dialogs/Result";
import MenuBar from "./layout/MenuBar";
import useChessOnline, {
  BoardControls as IBoardControls,
  GameControls as IGameControls,
  OnlineGame,
} from "@/hooks/useChessOnline";
import BoardControls from "./game/BoardControls";
import Waiting from "./game/Waiting";
import { SettingsContext } from "@/context/settings";
import Clock from "./game/Clock";
import PlayerCard from "./game/PlayerCard";
import { ChatMessage, Connection, Player } from "@/server/types/lobby";
import { BoardColumn, BoardRow, PanelColumn, PanelColumnLg, PanelContainer } from "./layout/GameLayout";

import { DurationObjectUnits } from "luxon";
import GameControls from "./game/GameControls";
import MoveHistory, { MoveTape } from "./game/MoveHistory";
import LiveChat from "./game/LiveChat";
interface Props {
  lobbyid: string;
}

interface GameDetails {
  players: Record<Chess.Color, Connection | undefined>;
  timeControl: Chess.TimeControl | undefined | null;
  ratingCategory: Chess.RatingCategory | undefined | null;
}

export const GameContext = React.createContext<{
  onlineGame: OnlineGame;
  orientation: Chess.Color;
}>({} as any);

export default function GameOnline({ lobbyid }: Props) {
  const onlineGame = useChessOnline(lobbyid);
  const [showResult, setShowResult] = useState(true);
  const {
    chat,
    sendMessage,
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
    availablePremoves,
    premoveQueue,
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
  if (!currentGame) return <Waiting lobbyUrl={`${process.env.NEXT_PUBLIC_BASE_URL}/play/${lobbyid}`} />;

  const gameData = currentGame.data;
  return (
    <GameContext.Provider value={{ onlineGame, orientation }}>
      <div className="flex flex-col h-full w-full justify-center ">
        <Result
          outcome={gameData.outcome}
          isOpen={(gameData.outcome && showResult) || false}
          close={() => {
            setShowResult(false);
          }}
        />
        <div className="flex flex-col md:flex-row h-full w-full items-start  md:items-center justify-center ">
          <div className="flex flex-row w-full lg:h-fit lg:basis-[100vh] justify-center">
            <BoardColumn>
              <div className="w-full md:hidden">
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
                  key={currentGame.id}
                  showCoordinates={settings.display.showCoordinates}
                  movementType={settings.gameBehavior.movementType}
                  theme={settings.display.boardTheme}
                  pieceSet={settings.display.pieceTheme}
                  orientation={orientation}
                  legalMoves={gameData.legalMoves}
                  legalPremoves={availablePremoves}
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
                  premoveQueue={premoveQueue}
                  clearPremoveQueue={gameControls.clearPremoveQueue}
                  onPremove={(move) => {
                    if (gameControls.onPremove) {
                      gameControls.onPremove(move);
                    }
                  }}
                />
                <div className="flex flex-row w-full justify-between">
                  {players.w && <PlayerCard connection={players.w} />}
                  <Clock timeRemaining={timeRemaining.w} color="w" size="sm" />
                </div>
              </div>

              {/* <div className="min-h-[120px] w-full block lg:hidden">
              <BoardControls controls={boardControls} />
              <GameControls
                size="sm"
                className="bg-white/[0.1]"
                gameControls={gameControls}
                flipBoard={() => {
                  setOrientation((cur) => (cur === "w" ? "b" : "w"));
                }}
              />
            </div> */}
            </BoardColumn>
          </div>
          <PanelColumnLg className="py-10 ">
            <PanelOnline
              chat={chat}
              sendMessage={sendMessage}
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
        </div>
      </div>
    </GameContext.Provider>
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
  chat: ChatMessage[];
  sendMessage: (message: string) => void;
}
function PanelOnline({ gameDetails, boardControls, gameControls, moveHistory, flipBoard, currentOffset }: PanelProps) {
  const { onlineGame } = useContext(GameContext);
  const { currentGame } = onlineGame;
  const players = gameDetails.players;
  const rated = onlineGame.currentGame?.rated;
  const { opening } = onlineGame;
  return (
    <PanelContainer>
      {currentGame ? (
        <>
          <div className="w-full p-4 bg-elevation-2">
            <p>
              {`${rated ? "Rated" : "Unrated"} ${gameDetails.ratingCategory} game`}
              <span className="text-light-300">
                {gameDetails.timeControl
                  ? ` (${gameDetails.timeControl.timeSeconds / 60} + ${gameDetails.timeControl.incrementSeconds})`
                  : ""}
              </span>
            </p>
            <p className="text-sm text-light-300">{`${players.w?.player.username} vs. ${players.b?.player.username}`}</p>
          </div>
          <div className="w-full p-2 px-3 text-sm bg-elevation-2 shadow-md">
            {
              <p className="text-light-200">
                <span className="text-gold-100">{`Opening: `}</span>
                {`${opening?.name || ""}`}
                <span className="inline text-light-300">{`${opening?.eco ? ` (${opening.eco})` : ""}`}</span>
              </p>
            }
          </div>
        </>
      ) : (
        <></>
      )}
      <MoveHistory
        moveHistory={moveHistory}
        jumpToOffset={boardControls.jumpToOffset}
        currentOffset={currentOffset}
        usePieceIcons={true}
      />
      <BoardControls controls={boardControls} flipBoard={flipBoard} />
      <GameControls gameControls={gameControls} flipBoard={flipBoard} size="lg" />
      <LiveChat></LiveChat>
    </PanelContainer>
  );
}

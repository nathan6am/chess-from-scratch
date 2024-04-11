import React, { useEffect, useState, useMemo, useContext } from "react";

//Type Definitions
import type {
  BoardControls as IBoardControls,
  GameControls as IGameControls,
  OnlineGame,
} from "@/hooks/useChessOnline";
import type { ChatMessage, Connection } from "@/server/types/lobby";
import type { DurationObjectUnits } from "luxon";

//Components
import Waiting from "./game/Waiting";
import Board from "@/components/board/Board";
import BoardControls from "./game/BoardControls";
import Clock from "./game/Clock";
import PlayerCard from "./game/PlayerCard";
import GameControls from "./game/GameControls";
import MoveHistory, { MoveTape } from "./game/MoveHistory";
import LiveChat from "./game/LiveChat";
import Result from "@/components/dialogs/Result";
import {
  BoardColumn,
  InfoRow,
  GameContainer,
  PanelContainer,
  BoardContainer,
} from "./layout/templates/GameLayout";

//Hooks
import useChessOnline from "@/hooks/useChessOnline";
import useSettings from "@/hooks/useSettings";
import { useRouter } from "next/router";
import useGameCache from "@/hooks/useGameCache";

//Util
import * as Chess from "@/lib/chess";
import _ from "lodash";
import cn from "@/util/cn";
import { encodeGameToPgn } from "@/util/parsers/pgnParser";

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
  const router = useRouter();
  const { cacheGame } = useGameCache();
  const onlineGame = useChessOnline({
    lobbyId: lobbyid,
    onConnectionError: () => {
      alert(
        "Unable to connect to the server. The lobby code may be invalid or the server may be down."
      );
    },
  });
  const [showResult, setShowResult] = useState(false);
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

  const settings = useSettings();
  const timeControl = currentGame?.data.config.timeControl;
  const ratingCategory = currentGame?.ratingCategory;
  const [orientation, setOrientation] = useState<Chess.Color>(playerColor || "w");

  useEffect(() => {
    if (currentGame?.data.outcome) {
      setShowResult(true);
    }
  }, [currentGame?.data.outcome]);

  //Parse player information from the lobby
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

  //Establish game details
  const gameDetails: GameDetails = {
    players: players,
    timeControl: timeControl,
    ratingCategory: ratingCategory,
  };

  //Set the board orientation if the player color changes
  useEffect(() => {
    if (playerColor) setOrientation(playerColor);
  }, [playerColor]);

  const gameData = useMemo(() => {
    if (!currentGame) return Chess.createGame({});
    return currentGame.data;
  }, [currentGame]);

  if (!onlineGame.connectionStatus.lobby) {
    return (
      <div className="w-full h-full flex flex-1 justify-center items-center">Connecting...</div>
    );
  }
  //TODO: Add connecting component

  return (
    <GameContext.Provider value={{ onlineGame, orientation }}>
      <GameContainer className="pt-10 md:pt-0">
        <div className="w-full md:hidden absolute top-0 right-0 left-0">
          <MoveTape
            moveHistory={gameData.moveHistory}
            jumpToOffset={boardControls.jumpToOffset}
            currentOffset={livePositionOffset}
            usePieceIcons={true}
          />
        </div>
        <Result
          onRematch={() => {
            gameControls.requestRematch();
          }}
          onAnalyze={() => {
            if (!currentGame) return;
            cacheGame(encodeGameToPgn(currentGame), lobbyid);
            router.push(`/study/analyze?sourceType=last`);
          }}
          outcome={gameData.outcome}
          isOpen={(gameData.outcome && showResult) || false}
          close={() => {
            setShowResult(false);
          }}
        />
        <BoardColumn
          className={cn({
            "flex-col": orientation === "w",
            "flex-col-reverse": orientation === "b",
          })}
        >
          <InfoRow className="md:py-2">
            <div className="shrink-0 grow">
              {players.b && <PlayerCard connection={players.b} />}
            </div>
            <Clock timeRemaining={timeRemaining.b} color="b" size="sm" />
          </InfoRow>
          {/* 
              
              <div className={`flex ${orientation === "w" ? "flex-col" : "flex-col-reverse"} w-full`}>
                <div className="flex flex-row w-full justify-between">
                  {players.b && <PlayerCard connection={players.b} />}
                  <Clock timeRemaining={timeRemaining.b} color="b" size="sm" />
                </div> */}
          <BoardContainer>
            <Board
              key={currentGame?.id}
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
          </BoardContainer>
          {/* <div className="flex flex-row w-full justify-between">
                  {players.w && <PlayerCard connection={players.w} />}
                  <Clock timeRemaining={timeRemaining.w} color="w" size="sm" />
                </div>
              </div> */}
          <InfoRow className="md:py-2">
            <div className="shrink-0 grow">
              {players.w && <PlayerCard connection={players.w} />}
            </div>
            <Clock timeRemaining={timeRemaining.w} color="w" size="sm" />
          </InfoRow>
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
        <PanelContainer>
          <>
            {currentGame ? (
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
            ) : (
              <Waiting lobbyUrl={`${process.env.NEXT_PUBLIC_BASE_URL}/play/${lobbyid}`} />
            )}
          </>
        </PanelContainer>
      </GameContainer>
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
function PanelOnline({
  gameDetails,
  boardControls,
  gameControls,
  moveHistory,
  flipBoard,
  currentOffset,
}: PanelProps) {
  const { onlineGame } = useContext(GameContext);
  const { currentGame } = onlineGame;
  const players = gameDetails.players;
  const rated = onlineGame.currentGame?.rated;
  const { opening } = onlineGame;
  return (
    <PanelContainer>
      {currentGame ? (
        <>
          <div className="w-full p-4 bg-elevation-3 hidden md:block">
            <p>
              {`${rated ? "Rated" : "Unrated"} • ${gameDetails.ratingCategory} • `}
              <span className="text-light-300">
                {gameDetails.timeControl
                  ? ` (${gameDetails.timeControl.timeSeconds / 60} + ${
                      gameDetails.timeControl.incrementSeconds
                    })`
                  : ""}
              </span>
            </p>
            <p className="text-sm text-light-300">{`${players.w?.player.username} vs. ${players.b?.player.username}`}</p>
          </div>
          <div className="w-full p-2 px-3 text-sm bg-elevation-2 shadow-md hidden md:block">
            {
              <p className="text-light-200">
                <span className="text-gold-100">{`Opening: `}</span>
                {`${opening?.name || ""}`}
                <span className="inline text-light-300">{`${
                  opening?.eco ? ` (${opening.eco})` : ""
                }`}</span>
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

function ColorIcon({ color }: { color: Chess.Color }) {
  if (color === "w")
    return (
      <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-white mr-1 " />
    );
  return (
    <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-white mr-1 " />
  );
}

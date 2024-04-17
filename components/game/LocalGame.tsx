import {
  GameContainer,
  BoardColumn,
  BoardContainer,
  PanelContainer,
  InfoRow,
} from "@/components/layout/templates/GameLayout";
import { useEffect, useState } from "react";
import React, { useCallback } from "react";
import * as Chess from "@/lib/chess";
import useLocalGame from "@/hooks/useLocalGame";
import Board from "@/components/board/Board";
import useSettings from "@/hooks/useSettings";
import type { TimeControl } from "@/lib/chess";
import MoveHistory from "./MoveHistory";
import BoardControls from "./BoardControls";
import { FiFlag } from "react-icons/fi";
import { MdRestartAlt } from "react-icons/md";
import { Button } from "../base";
import { useRouter } from "next/router";
import { gameDataToPgn } from "@/util/parsers/pgnParser";
import Clock from "./Clock";
import useGameCache from "@/hooks/cache/useGameCache";
interface Props {
  fromPosition?: string;
  autoFlip?: boolean;
  invertOpposingPieces?: boolean;
  timeControl?: TimeControl;
}
export default function LocalGame({ autoFlip, fromPosition, timeControl, invertOpposingPieces }: Props) {
  const settings = useSettings();
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const router = useRouter();
  const { cacheGame } = useGameCache();
  const {
    currentGame,
    currentBoard,
    lastMove,
    moveable,
    onMove,
    opening,
    boardControls,
    livePositionOffset,
    resign,
    restartGame,
    clock,
  } = useLocalGame({
    gameConfig: {
      startPosition: fromPosition,
      timeControl: timeControl,
    },
  });
  const onAnalyze = useCallback(() => {
    const pgn = gameDataToPgn(currentGame, {
      event: "Local Game",
      site: "next-chess.dev",
      date: new Date().toISOString().split("T")[0],
      result: "*",
      eco: opening?.eco,
      opening: opening?.name,
    });
    cacheGame(pgn, "1");
    router.push("/study/analyze?gameId=1&sourceType=last");
  }, [router, currentGame, opening, cacheGame]);
  useEffect(() => {
    if (!autoFlip) return;
    setOrientation(currentGame.activeColor);
  }, [autoFlip, currentGame.activeColor]);
  return (
    <GameContainer>
      <BoardColumn>
        <InfoRow className="py-2">
          {invertOpposingPieces ? <></> : <div />}
          <div className={invertOpposingPieces ? "rotate-180" : ""}>
            {timeControl &&
              (orientation === "b" ? (
                <Clock color="w" timeRemaining={clock.timeRemaining.w} size="sm" />
              ) : (
                <Clock color="b" timeRemaining={clock.timeRemaining.b} size="sm" />
              ))}
          </div>
        </InfoRow>
        <BoardContainer>
          <Board
            invertOpposingPieces={invertOpposingPieces}
            showCoordinates={settings.display.showCoordinates}
            movementType={settings.gameBehavior.movementType}
            theme={settings.display.boardTheme}
            pieceSet={settings.display.pieceTheme}
            orientation={orientation}
            legalMoves={currentGame.legalMoves}
            showHighlights={true}
            showTargets={true}
            pieces={currentBoard || currentGame.board}
            animationSpeed={settings.display.animationSpeed}
            lastMove={lastMove}
            activeColor={currentGame.activeColor}
            moveable={moveable && !currentGame.outcome ? "both" : "none"}
            preMoveable={false}
            autoQueen={settings.gameBehavior.autoQueen}
            onMove={onMove}
            onPremove={() => {}}
          />
        </BoardContainer>
        <InfoRow className="py-2">
          <div></div>
          <>
            {timeControl &&
              (orientation === "w" ? (
                <Clock color="w" timeRemaining={clock.timeRemaining.w} size="sm" />
              ) : (
                <Clock color="b" timeRemaining={clock.timeRemaining.b} size="sm" />
              ))}
          </>
        </InfoRow>
      </BoardColumn>
      <PanelContainer>
        <>
          <h2 className="w-full text-gold-200 text-xl text-center font-bold py-4 bg-elevation-3">Play Chess</h2>
          <div className="w-full p-2 px-3 text-sm bg-elevation-2 shadow-md hidden md:block">
            {
              <p className="text-light-200">
                <span className="text-gold-100">{`Opening: `}</span>
                {`${opening?.name || ""}`}
                <span className="inline text-light-300">{`${opening?.eco ? ` (${opening.eco})` : ""}`}</span>
              </p>
            }
          </div>
          <MoveHistory
            moveHistory={currentGame.moveHistory}
            jumpToOffset={boardControls.jumpToOffset}
            currentOffset={livePositionOffset}
            usePieceIcons={true}
          />
          <BoardControls
            controls={boardControls}
            flipBoard={() => {
              setOrientation((cur) => (cur === "w" ? "b" : "w"));
            }}
          />
          <div className="grid grid-cols-3 w-full px-4 gap-x-2 bg-elevation-2 py-2">
            {!currentGame.outcome && (
              <Button
                onClick={resign}
                label="Resign"
                icon={FiFlag}
                iconClassName="mr-1"
                variant="danger"
                size="lg"
              ></Button>
            )}
            <Button
              onClick={restartGame}
              label={currentGame.outcome ? "Play Again" : "Restart"}
              icon={MdRestartAlt}
              iconClassName="mr-1 text-lg"
              variant="neutral"
              size="lg"
            ></Button>
            <Button label="Analyze" variant="neutral" size="lg" onClick={onAnalyze}></Button>
          </div>
        </>
      </PanelContainer>
    </GameContainer>
  );
}

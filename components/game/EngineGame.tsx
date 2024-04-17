import Board from "../board/Board";
import { useEngineGame } from "@/hooks/useEngineGame";
import * as Chess from "@/lib/chess";
import { SettingsContext } from "@/context/settings";
import { useCallback, useContext, useEffect, useState } from "react";
import { Button } from "@/components/base";
import { useRouter } from "next/router";
import useGameCache from "@/hooks/cache/useGameCache";
import { encodeGameToPgn, gameDataToPgn } from "@/util/parsers/pgnParser";
import Result from "../dialogs/Result";
import {
  GameContainer,
  BoardContainer,
  PanelContainer,
  InfoRow,
  BoardColumn,
} from "@/components/layout/templates/GameLayout";
import classNames from "classnames";
import MoveHistory from "./MoveHistory";
import BoardControls from "./BoardControls";
import { FiRepeat, FiFlag } from "react-icons/fi";
import { MdComputer, MdRestartAlt } from "react-icons/md";
import { GridLoader, RingLoader } from "react-spinners";
interface Props {
  startPosition?: string;
  preset?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  playerColor?: Chess.Color;
  timeControl?: Chess.TimeControl;
}

import Clock from "./Clock";
import cn from "@/util/cn";
import useAuth from "@/hooks/useAuth";
export default function EngineGame({ startPosition, preset, playerColor, timeControl }: Props) {
  const { user } = useAuth();
  const [currentPreset, setCurrentPreset] = useState(preset || 10);
  const [orientation, setOrientation] = useState<Chess.Color>(playerColor || "w");
  const { settings } = useContext(SettingsContext);
  const { cacheGame } = useGameCache();
  const {
    currentGame,
    ready,
    onMove,
    clock,
    isThinking,
    livePositionOffset,
    boardControls,
    currentBoard,
    moveable,
    lastMove,
    availablePremoves,
    clearPremoveQueue,
    resign,
    premoveQueue,
    onPremove,
    opening,
    restartGame,
  } = useEngineGame({
    gameConfig: { startPosition },
    preset: preset || 10,
    playerColor,
    timeControl,
  });
  const router = useRouter();
  const onAnalyze = useCallback(() => {
    const pgn = gameDataToPgn(currentGame, {
      white: `${playerColor === "w" ? user?.username || "You" : `Stockfish Level ${currentPreset}`}`,
      black: `${playerColor === "b" ? user?.username || "You" : `Stockfish Level ${currentPreset}`}`,
      event: "Engine Game",
      site: "next-chess.dev",
      date: new Date().toISOString().split("T")[0],
      result: "*",
      eco: opening?.eco,
      opening: opening?.name,
    });
    cacheGame(pgn, "1");
    router.push("/study/analyze?gameId=1&sourceType=last");
  }, [router, currentGame, playerColor, currentPreset, user, opening, cacheGame]);

  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (currentGame.outcome) {
      setShowResult(true);
    }
  }, [currentGame.outcome]);
  return (
    <GameContainer>
      <Result
        isOpen={!!currentGame.outcome && showResult}
        outcome={currentGame.outcome}
        onRematch={() => {
          restartGame();
          setShowResult(false);
        }}
        onAnalyze={onAnalyze}
        close={() => {
          setShowResult(false);
        }}
      />
      <BoardColumn
        className={cn("items-center relative", {
          "flex-col-reverse": orientation === "b",
        })}
      >
        <InfoRow className="py-2">
          <div className="bg-elevation-3 py-1.5 px-4 rounded-md max-w-[16em] w-full flex flex-row">
            <p>Stockfish Level {currentPreset}</p>
            <>
              <span className="inline h-0 ml-3">
                {isThinking && <RingLoader size="20px" className="inline mt-0.5" color="#FFD77D" />}
              </span>
            </>
          </div>
          <>{timeControl && <Clock color="b" timeRemaining={clock.timeRemaining.b} size="sm" />}</>
        </InfoRow>

        <BoardContainer>
          <Board
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
            moveable={moveable ? playerColor || "none" : "none"}
            preMoveable={settings.gameBehavior.allowPremoves}
            premoveQueue={premoveQueue}
            clearPremoveQueue={clearPremoveQueue}
            autoQueen={settings.gameBehavior.autoQueen}
            legalPremoves={availablePremoves}
            onMove={onMove}
            onPremove={onPremove}
          />
        </BoardContainer>
        <InfoRow className="py-2">
          <div className="bg-elevation-3 py-1.5 px-4 rounded-md max-w-xs w-full">You</div>
          <>{timeControl && <Clock color="w" timeRemaining={clock.timeRemaining.w} size="sm" />}</>
        </InfoRow>
      </BoardColumn>

      <PanelContainer>
        <>
          <h2 className="w-full text-gold-200 text-xl text-center font-bold py-4 bg-elevation-3">
            <MdComputer className="inline mr-1 mb-1" /> Play vs. Computer
          </h2>
          <div className="w-full bg-elevation-4 p-4">
            <p>Opponent: {`Stockfish Level ${preset} ${preset === 10 ? "(Full strength)" : ""}`}</p>
          </div>
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

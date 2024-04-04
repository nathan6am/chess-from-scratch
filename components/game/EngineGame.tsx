import Board from "../board/Board";
import { useEngineGame } from "@/hooks/useEngineGame";
import * as Chess from "@/lib/chess";
import { SettingsContext } from "@/context/settings";
import { useContext, useState } from "react";
import { Button } from "@/components/base";
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
import { MdRestartAlt } from "react-icons/md";

interface Props {
  startPosition?: string;
  preset?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  playerColor?: Chess.Color;
  timeControl?: Chess.TimeControl;
}
export default function EngineGame({ startPosition, preset, playerColor, timeControl }: Props) {
  const [orientation, setOrientation] = useState<Chess.Color>(playerColor || "w");
  const { settings } = useContext(SettingsContext);
  const {
    currentGame,
    ready,
    onMove,
    clock,
    livePositionOffset,
    boardControls,
    currentBoard,
    moveable,
    lastMove,
    availablePremoves,
    clearPremoveQueue,
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
  return (
    <GameContainer>
      <BoardColumn className="items-center relative">
        <>
          <div className="absolute top-[-2em] bottom-[-2em] flex flex-row w-inherit">
            <div className="flex flex-col justify-between items-center shrink">
              <>
                <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
                  {playerColor === "b" ? "You" : "Stockfish"}
                  {/* <span className="inline opacity-50">{`(${
                          analysis.tagData.eloWhite || "?"
                        })`}</span> */}
                </p>
              </>
              <>
                <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
                  {playerColor === "b" ? "Stockfish" : "You"}
                  {/* <span className="inline opacity-50">{`(${
                          analysis.tagData.eloWhite || "?"
                        })`}</span> */}
                </p>
              </>
            </div>
            <div className="flex flex-col justify-between items-center shrink">
              <span></span>
              <span></span>
            </div>
          </div>
        </>
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
      </BoardColumn>

      <PanelContainer>
        <>
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
            <Button label="Resign" icon={FiFlag} iconClassName="mr-1" variant="neutral" size="lg"></Button>
            <Button
              onClick={restartGame}
              label="Restart"
              icon={MdRestartAlt}
              iconClassName="mr-1 text-lg"
              variant="neutral"
              size="lg"
            ></Button>
            <Button label="Analyze" variant="neutral" size="lg"></Button>
          </div>
        </>
      </PanelContainer>
    </GameContainer>
  );
}

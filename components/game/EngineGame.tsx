import Board from "./Board";
import { useEngineGame } from "@/hooks/useEngineGame";
import * as Chess from "@/lib/chess";
import { SettingsContext } from "@/context/settings";
import { useContext, useState } from "react";
import { BoardColumn, BoardRow, PanelColumn } from "../layout/GameLayout";
import classNames from "classnames";
interface Props {
  startPosition?: string;
  preset?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  playerColor?: Chess.Color;
  timeControl?: Chess.TimeControl;
}
export default function EngineGame({ startPosition, preset, playerColor, timeControl }: Props) {
  const [orientation, setOrientation] = useState<Chess.Color>(playerColor || "w");
  const { settings } = useContext(SettingsContext);
  const { currentGame, ready, onMove, clock } = useEngineGame({
    gameConfig: { startPosition },
    preset: preset || 10,
    playerColor,
    timeControl,
  });
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <BoardRow>
        <div className="flex flex-row h-fit basis-[100vh] justify-center md:pl-4">
          <BoardColumn className="items-center relative">
            <>
              <div className="absolute top-[-2em] bottom-[-2em] flex flex-row w-inherit">
                <div className="flex flex-col justify-between items-center shrink">
                  <>
                    <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
                      {playerColor === "w" ? "You" : "Stockfish"}
                      {/* <span className="inline opacity-50">{`(${
                          analysis.tagData.eloWhite || "?"
                        })`}</span> */}
                    </p>
                  </>
                  <>
                    <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
                      {playerColor === "w" ? "You" : "Stockfish"}
                      {/* <span className="inline opacity-50">{`(${
                          analysis.tagData.eloWhite || "?"
                        })`}</span> */}
                    </p>
                  </>
                </div>
                <div className="flex flex-col justify-between items-center shrink">
                  <span>trb</span>
                  <span>trw</span>
                </div>
              </div>
            </>
            <Board
              showCoordinates={settings.display.showCoordinates}
              movementType={settings.gameBehavior.movementType}
              theme={settings.display.boardTheme}
              pieceSet={settings.display.pieceTheme}
              orientation={orientation}
              legalMoves={currentGame.legalMoves}
              showHighlights={true}
              showTargets={true}
              pieces={currentGame.board}
              animationSpeed={settings.display.animationSpeed}
              lastMove={currentGame.lastMove}
              activeColor={currentGame.activeColor}
              moveable={playerColor || "none"}
              preMoveable={settings.gameBehavior.allowPremoves}
              autoQueen={settings.gameBehavior.autoQueen}
              onMove={onMove}
              onPremove={() => {}}
            />
          </BoardColumn>
        </div>

        <PanelColumn className="bg-[#1f1f1f]">
          <></>
        </PanelColumn>
      </BoardRow>
    </div>
  );
}

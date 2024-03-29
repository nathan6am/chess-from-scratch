import Board from "../board/Board";
import { useEngineGame } from "@/hooks/useEngineGame";
import * as Chess from "@/lib/chess";
import { SettingsContext } from "@/context/settings";
import { useContext, useState } from "react";
import {
  BoardColumn,
  BoardRow,
  PanelColumn,
  PanelColumnLg,
  PanelContainer,
} from "../layout/GameLayout";
import MenuBar from "@/components/layout/MenuBar";
import { MenuWrapper, MenuItems, MenuItem, MenuButton } from "../base/ToolMenu";
import classNames from "classnames";
import MoveHistory from "./MoveHistory";
import BoardControls from "./BoardControls";
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
  } = useEngineGame({
    gameConfig: { startPosition },
    preset: preset || 10,
    playerColor,
    timeControl,
  });
  return (
    <div className="flex flex-col h-full w-full  min-h-screen">
      <MenuBar>
        <MenuWrapper>
          <MenuButton>Game</MenuButton>
          <MenuItems>
            <MenuItem onClick={() => {}}>Restart</MenuItem>
            <MenuItem onClick={() => {}}>Resign</MenuItem>
            <MenuItem onClick={() => {}}>Export</MenuItem>
          </MenuItems>
        </MenuWrapper>
      </MenuBar>
      <BoardRow>
        <div className="flex flex-row h-fit md:basis-[100vh] w-full justify-center md:pl-4 mt-8 lg:mt-0">
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
              autoQueen={settings.gameBehavior.autoQueen}
              onMove={onMove}
              onPremove={() => {}}
            />
          </BoardColumn>
        </div>

        <PanelColumnLg>
          <PanelContainer>
            <>
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
            </>
          </PanelContainer>
        </PanelColumnLg>
      </BoardRow>
    </div>
  );
}

import { SettingsContext } from "@/context/settings";
import usePuzzleQueue from "@/hooks/usePuzzleQueue";
import PuzzlePanel from "./PuzzlePanel";
import React, { useContext, useState } from "react";
import { BoardColumn, BoardRow, PanelColumn } from "../layout/GameLayout";
import CheckBox from "../UI/CheckBox";
import Board from "../game/Board";
import BoardControls from "../game/BoardControls";
export default function PuzzleSolver() {
  const { puzzle, history, next } = usePuzzleQueue();
  const { settings } = useContext(SettingsContext);
  const currentGame = puzzle.currentGame;
  const [checked, setChecked] = useState(true);
  return (
    <>
      <BoardRow>
        <div className="flex flex-row h-fit basis-[100vh] justify-center md:pl-4">
          <BoardColumn>
            <Board
              lastMoveAnnotation={puzzle.annotation}
              key={puzzle.puzzle?.id || "empty"}
              showCoordinates={settings.display.showCoordinates}
              movementType={settings.gameBehavior.movementType}
              theme={settings.display.boardTheme}
              pieceSet={settings.display.pieceTheme}
              orientation={puzzle.orientation}
              legalMoves={currentGame.legalMoves}
              showHighlights={settings.display.showHighlights}
              showTargets={settings.display.showValidMoves}
              pieces={currentGame.board}
              animationSpeed={settings.display.animationSpeed}
              lastMove={currentGame.lastMove}
              activeColor={currentGame.activeColor}
              moveable={puzzle.puzzle?.playerColor || "none"}
              preMoveable={false}
              autoQueen={settings.gameBehavior.autoQueen}
              onMove={puzzle.onMove}
              onPremove={() => {}}
            />
          </BoardColumn>
        </div>
        <PanelColumn>
          <div className="h-full w-full bg-[#303030]">
            <p>{puzzle.solveState}</p>
            <div className="flex flex-col">
              <button onClick={puzzle.retry}>Retry</button>
              <button onClick={next}>Next Puzzle</button>
              <button onClick={puzzle.showSolution}>View the Solution</button>
            </div>
            <div className="w-full p-3">
              {puzzle.puzzle ? (
                <h2>
                  {puzzle.puzzle.playerColor === "w" ? "Find the best move for white" : "Find the best move for black"}
                </h2>
              ) : (
                <h2>Loading puzzles</h2>
              )}
            </div>
          </div>

          <BoardControls controls={puzzle.controls} />
        </PanelColumn>
      </BoardRow>
    </>
  );
}

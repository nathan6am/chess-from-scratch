import { SettingsContext } from "@/context/settings";
import usePuzzleQueue from "@/hooks/usePuzzleQueue";
import React, { useContext } from "react";
import { BoardColumn, BoardRow, PanelColumn } from "../layout/GameLayout";
import Board from "../game/Board";
export default function PuzzleSolver() {
  const { puzzle, history, next } = usePuzzleQueue();
  const { settings } = useContext(SettingsContext);
  const currentGame = puzzle.currentGame;
  return (
    <>
      <BoardRow>
        <BoardColumn>
          <Board
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
        <PanelColumn>
          <div className="w-full h-full">
            <p>{puzzle.solveState}</p>
            <button onClick={next}>Next Puzzle</button>
          </div>
        </PanelColumn>
      </BoardRow>
    </>
  );
}

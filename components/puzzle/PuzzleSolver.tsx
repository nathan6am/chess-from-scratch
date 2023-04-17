import { SettingsContext } from "@/context/settings";
import usePuzzleQueue from "@/hooks/usePuzzleQueue";
import PuzzlePanel from "./PuzzlePanel";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { BoardColumn, BoardRow, PanelColumn } from "../layout/GameLayout";

import CheckBox from "../UI/CheckBox";
import Board from "../game/Board";
import BoardControls from "../game/BoardControls";
import { BsFillCheckSquareFill, BsFillXSquareFill, BsCheckLg } from "react-icons/bs";
import { MdRestartAlt } from "react-icons/md";
export default function PuzzleSolver() {
  const { puzzle, history, next } = usePuzzleQueue();
  const { settings } = useContext(SettingsContext);
  const currentGame = puzzle.currentGame;
  const [checked, setChecked] = useState(true);
  const hidePiecesRef = React.useRef<boolean>(true);
  useEffect(() => {
    hidePiecesRef.current = true;
    if (puzzle.puzzle) {
      setTimeout(() => {
        hidePiecesRef.current = false;
      }, 100);
    }
  }, [puzzle.puzzle]);
  return (
    <>
      <BoardRow>
        <div className="flex flex-row h-fit basis-[100vh] justify-center md:pl-4">
          <BoardColumn>
            <Board
              keyPrefix={puzzle.puzzle?.id || "empty"}
              disableTransitions={hidePiecesRef.current}
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
          </div>
          <div className="w-full">
            {puzzle.puzzle ? (
              <PuzzlePrompt
                playerColor={puzzle.puzzle.playerColor}
                prompt={puzzle.prompt}
                retry={puzzle.retry}
                next={next}
              />
            ) : (
              <h2>Loading puzzles</h2>
            )}
          </div>
          <div className="w-full flex flex-row"></div>
          <BoardControls controls={puzzle.controls} flipBoard={puzzle.flipBoard} />
        </PanelColumn>
      </BoardRow>
    </>
  );
}

interface PromptProps {
  retry: () => void;
  next: () => void;
  prompt?: string;
  playerColor: "w" | "b";
}

function PuzzlePrompt({ prompt, playerColor }: PromptProps) {
  return (
    <div className="flex flex-row items-center bg-[#242424] p-3 justify-center py-6">
      {prompt === "start" && (
        <>
          <div
            className={`h-4 w-4 rounded-sm mr-2 ${playerColor === "w" ? "bg-white" : "bg-black"}`}
          ></div>{" "}
          <p>{`Find the best move for ${playerColor === "w" ? "white" : "black"}.`}</p>
        </>
      )}
      {prompt === "continue" && (
        <>
          <BsCheckLg className="text-green-500 mr-2" />
          <p>Best Move! Keep Going...</p>
        </>
      )}
      {prompt === "failed" && (
        <>
          <BsFillXSquareFill className="text-red-500 mr-2" />
          <p>{`That's not it`}</p>
        </>
      )}
    </div>
  );
}

interface PuzzleControlsProps {
  retry: () => void;
  next: () => void;
  showSolution: () => void;
  getHint: () => void;

  prompt?: string;
  solveState: string;
}
function PuzzleControls({ prompt, solveState }: PuzzleControlsProps) {
  const buttonsToShow = useMemo(() => {
    if (solveState === "solved") return ["analysis", "next"];
    if (prompt === "failed") return ["retry", "showSolution"];
    if (prompt === "start" || prompt === "continue") return ["getHint", "showSolution"];
  }, [solveState, prompt]);
}

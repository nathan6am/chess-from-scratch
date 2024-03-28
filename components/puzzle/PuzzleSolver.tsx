import { SettingsContext } from "@/context/settings";
import usePuzzleQueue from "@/hooks/usePuzzleQueue";
import PuzzlePanel from "./PuzzlePanel";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { BoardColumn, BoardRow, PanelColumn, PanelColumnLg, ScrollContainer } from "../layout/GameLayout";
import PuzzleFilters from "./PuzzleFilters";
import CheckBox from "../UI/CheckBox";
import Board from "../board/Board";
import { IoExtensionPuzzle } from "react-icons/io5";
import BoardControls from "../game/BoardControls";
import { BsFillCheckSquareFill, BsFillXSquareFill, BsCheckLg } from "react-icons/bs";
import { BiAnalyse, BiShow } from "react-icons/bi";
import { FaLightbulb } from "react-icons/fa";
import { MdRestartAlt } from "react-icons/md";
import { IoCaretForwardSharp } from "react-icons/io5";
import { ClipLoader } from "react-spinners";
import { Toggle } from "../UIKit";
import { RangeSlider } from "../UIKit";
export default function PuzzleSolver() {
  const [filterByTheme, setFilterByTheme] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(100);
  const [maxRating, setMaxRating] = useState(3500);
  const { puzzle, history, next } = usePuzzleQueue({
    themes: filterByTheme ? selectedThemes : null,
    minRating,
    maxRating,
  });

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
        <PanelColumnLg>
          <h2 className="w-full text-gold-200 text-xl text-center font-bold py-4 bg-elevation-3">
            <IoExtensionPuzzle className="inline mr-1 mb-1" /> Solve Puzzles
          </h2>
          <p>Rating Range</p>
          <RangeSlider
            minLabel={`${minRating}`}
            maxLabel={`${maxRating === 3500 ? `\u221E` : maxRating}`}
            value={[minRating, maxRating]}
            min={100}
            max={3500}
            step={100}
            onChange={([min, max]) => {
              setMinRating(min);
              setMaxRating(max);
            }}
          />
          <Toggle label="Filter by Theme" checked={filterByTheme} onChange={setFilterByTheme} />
          <div className="h-full w-full bg-elevation-2 grow relative">
            <ScrollContainer>
              <PuzzleFilters selectedThemes={selectedThemes} setSelectedThemes={setSelectedThemes} />
            </ScrollContainer>
          </div>
          <PuzzleControls
            prompt={puzzle.prompt}
            solveState={puzzle.solveState}
            retry={puzzle.retry}
            next={next}
            showSolution={puzzle.showSolution}
            getHint={() => {}}
          />
          <div className="w-full">
            <PuzzlePrompt
              playerColor={puzzle.puzzle?.playerColor || "w"}
              prompt={puzzle.prompt}
              retry={puzzle.retry}
              next={next}
              loading={!puzzle.puzzle}
            />
          </div>
          <div className="w-full flex flex-row"></div>
          <BoardControls controls={puzzle.controls} flipBoard={puzzle.flipBoard} />
        </PanelColumnLg>
      </BoardRow>
    </>
  );
}

interface PromptProps {
  retry: () => void;
  next: () => void;
  prompt?: string;
  loading?: boolean;
  playerColor: "w" | "b";
}

function PuzzlePrompt({ prompt, playerColor, loading }: PromptProps) {
  return (
    <div className="flex flex-row items-center bg-[#242424] p-3 justify-center py-6 min-h-[72px]">
      {loading && (
        <>
          <ClipLoader color="#ffffff" loading={loading} size={20} />
          <p className="ml-2">Loading puzzles...</p>
        </>
      )}
      {!loading && prompt === "start" && (
        <>
          <div className={`h-4 w-4 rounded-sm mr-2 ${playerColor === "w" ? "bg-white" : "bg-black"}`}></div>{" "}
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
      {prompt === "solved" && (
        <>
          <BsCheckLg className="text-green-500 mr-2" />
          <p>{`Puzzle Solved`}</p>
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
function PuzzleControls({ prompt, solveState, retry, next, showSolution, getHint }: PuzzleControlsProps) {
  const buttonsToShow = useMemo(() => {
    if (prompt === "solved") return ["analysis", "next"];
    if (prompt === "failed") return ["retry", "showSolution"];
    if (prompt === "start" || prompt === "continue") return ["getHint", "showSolution"];
    return [];
  }, [solveState, prompt]);
  return (
    <div className="flex flex-row items-center bg-[#181818] justify-around divide-x">
      {buttonsToShow.includes("getHint") && (
        <button className="flex flex-row items-center justify-center p-3 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full">
          <p>Get a Hint</p>
          <FaLightbulb className="ml-2" />
        </button>
      )}
      {buttonsToShow.includes("showSolution") && (
        <button
          onClick={showSolution}
          className="flex flex-row items-center justify-center p-3 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full"
        >
          <p>View the Solution</p>
          <BiShow className="ml-2" />
        </button>
      )}
      {buttonsToShow.includes("analysis") && (
        <button
          onClick={retry}
          className="flex flex-row items-center justify-center p-3 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full"
        >
          <p>Analyze</p>
          <BiAnalyse className="ml-2" />
        </button>
      )}
      {buttonsToShow.includes("retry") && (
        <button
          onClick={retry}
          className="flex flex-row items-center justify-center p-3 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full"
        >
          <p>Retry</p>
          <MdRestartAlt className="ml-2" />
        </button>
      )}
      {buttonsToShow.includes("next") && (
        <button
          onClick={next}
          className="flex flex-row items-center justify-center p-3 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full"
        >
          <p>Next Puzzle</p>
          <IoCaretForwardSharp className="ml-2" />
        </button>
      )}
    </div>
  );
}

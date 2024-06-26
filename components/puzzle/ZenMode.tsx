import { SettingsContext } from "@/context/settings";
import usePuzzleQueue from "@/hooks/usePuzzleQueue";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { ScrollContainer } from "../layout/GameLayout";
import PuzzleFilters from "./PuzzleFilters";
import { GameContainer, BoardColumn, BoardContainer, PanelContainer } from "../layout/templates/GameLayout";
import Board from "../board/Board";
import { IoExtensionPuzzle } from "react-icons/io5";
import BoardControls from "../game/BoardControls";
import { BsFillCheckSquareFill, BsFillXSquareFill, BsCheckLg } from "react-icons/bs";
import { BiAnalyse, BiShow } from "react-icons/bi";
import { FaLightbulb } from "react-icons/fa";
import { MdRestartAlt } from "react-icons/md";
import { IoCaretForwardSharp } from "react-icons/io5";
import { ClipLoader } from "react-spinners";
import { Toggle, RangeSlider } from "@/components/base";
import { Label } from "../base/Typography";
import { FaFire } from "react-icons/fa";
import useSettings from "@/hooks/useSettings";
export default function PuzzleSolver() {
  const { settings, updateSettings } = useSettings();
  const { filterByTheme, minRating, maxRating, selectedThemes } = settings.puzzles;
  const { puzzle, history, next, streak, loading } = usePuzzleQueue({
    themes: filterByTheme ? selectedThemes : null,
    minRating,
    maxRating,
  });

  const currentGame = puzzle.currentGame;
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
      <GameContainer>
        <BoardColumn>
          <BoardContainer>
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
              moveable={(puzzle.moveable && puzzle.puzzle?.playerColor) || "none"}
              preMoveable={false}
              autoQueen={settings.gameBehavior.autoQueen}
              onMove={puzzle.onMove}
              hint={puzzle.hint}
              onPremove={() => {}}
            />
          </BoardContainer>
        </BoardColumn>
        <PanelContainer>
          <h2 className="w-full text-gold-200 text-xl text-center font-bold py-4 bg-elevation-3 hidden md:block">
            <IoExtensionPuzzle className="inline mr-1 mb-1" /> Solve Puzzles
          </h2>
          <div className="w-full h-full flex flex-1 flex-col-reverse md:flex-col">
            <div className="w-full h-full flex flex-1 flex-col">
              <div className="p-4 bg-elevation-4">
                <p className="text-light-100">
                  <span>
                    <FaFire className="text-orange-300 text-xl inline mb-1 mr-1" />
                  </span>
                  {`Current Streak: `}
                  <span className="font-semibold">{streak}</span>
                </p>
              </div>
              <div className="w-full px-4 py-2">
                <h2 className="mb-2 font-semibold text-lg text-gold-200">Filter Options</h2>
                <div className="mb-4">
                  <Label>Rating Range</Label>
                  <RangeSlider
                    minLabel={`${minRating}`}
                    maxLabel={`${maxRating === 3000 ? `3000+` : maxRating}`}
                    value={[minRating, maxRating]}
                    min={500}
                    max={3000}
                    step={100}
                    onChange={([min, max]) => {
                      updateSettings({ puzzles: { ...settings.puzzles, minRating: min, maxRating: max } });
                    }}
                  />
                </div>
                <Toggle
                  label="Filter by Theme"
                  checked={filterByTheme}
                  onChange={(enabled) => {
                    updateSettings({ puzzles: { ...settings.puzzles, filterByTheme: enabled } });
                  }}
                  reverse
                />
              </div>
              <div className="bg-elevation-3 text-sm px-4 py-[4px] shadow">
                <p className="text-gold-200">Puzzle Themes</p>
              </div>
              <div className="h-full w-full bg-elevation-2 grow relative min-h-[28em] md:min-h-0">
                <ScrollContainer>
                  <PuzzleFilters
                    selectedThemes={selectedThemes}
                    setSelectedThemes={(themes) =>
                      updateSettings({ puzzles: { ...settings.puzzles, selectedThemes: themes } })
                    }
                    disabled={!filterByTheme}
                  />
                </ScrollContainer>
              </div>
            </div>
            <div className="w-full">
              <PuzzleControls
                prompt={puzzle.prompt}
                solveState={puzzle.solveState}
                retry={puzzle.retry}
                next={next}
                showSolution={puzzle.showSolution}
                getHint={puzzle.getHint}
                currentPuzzleId={puzzle.puzzle?.id}
              />

              <PuzzlePrompt
                playerColor={puzzle.puzzle?.playerColor || "w"}
                prompt={puzzle.prompt}
                retry={puzzle.retry}
                next={next}
                loading={!puzzle.puzzle || loading}
              />

              <BoardControls controls={puzzle.controls} flipBoard={puzzle.flipBoard} />
            </div>
          </div>
        </PanelContainer>
      </GameContainer>
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
      {!loading && prompt === "continue" && (
        <>
          <BsCheckLg className="text-green-400 mr-2" />
          <p>Best Move! Keep Going...</p>
        </>
      )}
      {!loading && prompt === "failed" && (
        <>
          <BsFillXSquareFill className="text-red-500 mr-2" />
          <p>{`That's not it`}</p>
        </>
      )}
      {!loading && prompt === "solved" && (
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
  currentPuzzleId?: string | null;
  prompt?: string;
  solveState: string;
}
function PuzzleControls({
  prompt,
  solveState,
  retry,
  next,
  showSolution,
  getHint,
  currentPuzzleId,
}: PuzzleControlsProps) {
  const buttonsToShow = useMemo(() => {
    if (prompt === "solved") return ["analysis", "next"];
    if (prompt === "failed") return ["retry", "showSolution"];
    if (prompt === "start" || prompt === "continue") return ["getHint", "showSolution"];
    return [];
  }, [solveState, prompt]);
  return (
    <div className="flex flex-row items-center bg-[#181818] justify-around divide-x">
      {buttonsToShow.includes("getHint") && (
        <button
          onClick={getHint}
          className="flex flex-row items-center justify-center p-3 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full"
        >
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
        <a
          href={`/study/analyze?gameId=${currentPuzzleId}&sourceType=puzzle`}
          target="_blank"
          rel="noreferrer"
          className="flex flex-row items-center justify-center p-3 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full"
        >
          <p>Analyze</p>
          <BiAnalyse className="ml-2" />
        </a>
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

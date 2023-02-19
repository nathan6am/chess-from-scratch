import React, { useState, useRef, Fragment } from "react";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";
import * as Chess from "@/lib/chess";
import { BoardRow, BoardColumn, PanelColumnLg, LayoutComponentProps } from "../layout/GameLayout";
import Board from "../game/Board";
import EvalBar from "./EvalBar";
import EvalInfo from "./EvalInfo";
import VarationTree from "./VarationTree";
import BoardControls from "../game/BoardControls";
import { ScrollContainer } from "../layout/GameLayout";
import Explorer from "./Explorer";
import { Tab } from "@headlessui/react";
import { MdModeComment } from "react-icons/md";
import { FaExclamationCircle } from "react-icons/fa";
import { BsShareFill } from "react-icons/bs";
import Comments from "./Comments";
import Share from "./Share";
import AnalysisPanel from "./AnalysisPanel";
export default function AnalysisBoard() {
  const analysis = useAnalysisBoard();
  const {
    currentGame,
    onMove,
    evaler,
    evalEnabled,
    setEvalEnabled,
    boardControls,
    pgn,
    mainLine,
    rootNodes,
    setCurrentKey,
    path,
    currentKey,
    debouncedNode,
    currentNode,
    commentControls,
    explorer,
  } = analysis;
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const boardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full w-full justify-center">
      <BoardRow>
        <div className="flex flex-row h-fit w-full justify-center">
          <BoardColumn className={evalEnabled ? "items-end" : "items-center"}>
            <Board
              ref={boardRef}
              orientation={orientation}
              legalMoves={currentGame.legalMoves}
              showHighlights={true}
              showTargets={true}
              pieces={currentGame.board}
              animationSpeed="normal"
              lastMove={currentGame.lastMove}
              activeColor={currentGame.activeColor}
              moveable={"both"}
              preMoveable={false}
              autoQueen={false}
              onMove={onMove}
              onPremove={() => {}}
            />
          </BoardColumn>
          {evalEnabled && (
            <EvalBar
              scoreType={evaler.currentScore?.type || "cp"}
              value={evaler.currentScore?.value || 0}
              orientation={orientation}
              scale={9.06}
              key={orientation}
            />
          )}
        </div>

        <PanelColumnLg className="bg-[#1f1f1f]">
          <Tab.Group>
            <Tab.List className="flex bg-[#121212] shadow-lg">
              <StyledTab>
                <p>Analyze</p>
              </StyledTab>
              <StyledTab>
                <p>Explorer</p>
              </StyledTab>
              <StyledTab>
                <p>Review</p>
              </StyledTab>
            </Tab.List>
            <Tab.Panel as={Fragment}>
              <AnalysisPanel analysis={analysis} boardRef={boardRef} />
            </Tab.Panel>
            <Tab.Panel>
              <Explorer
                data={explorer.data}
                error={explorer.error}
                isLoading={explorer.isLoading}
                currentGame={currentGame}
                onMove={onMove}
              />
            </Tab.Panel>
          </Tab.Group>
          <BoardControls
            controls={boardControls}
            flipBoard={() => {
              setOrientation((cur) => (cur === "w" ? "b" : "w"));
            }}
          />
        </PanelColumnLg>
      </BoardRow>
    </div>
  );
}
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface TabProps {
  children?: JSX.Element | JSX.Element[] | string;
}
function StyledTab({ children }: TabProps) {
  return (
    <Tab
      className={({ selected }) =>
        classNames(
          "flex-1 border-b border-b-4 py-2 text-md text-white/[0.7] px-4",
          "focus:outline-none ",
          selected
            ? "bg-[#303030] border-sepia"
            : "bg-[#262626] border-[#262626] text-white/[0.5] hover:bg-[#202020] hover:text-white"
        )
      }
    >
      {children}
    </Tab>
  );
}

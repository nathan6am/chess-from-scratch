import React, { useState } from "react";
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
export default function AnalysisBoard() {
  const {
    currentGame,
    onMove,
    evaler,
    evalEnabled,
    setEvalEnabled,
    boardControls,
    pgn,
    mainLine,
    setCurrentKey,
    path,
    currentKey,
    debouncedNode,
    currentNode,
    commentControls,
    explorer,
  } = useAnalysisBoard();
  const [orientation, setOrientation] = useState<Chess.Color>("w");

  return (
    <div className="flex flex-col h-full w-full justify-center">
      <BoardRow>
        <div className="flex flex-row h-fit w-full justify-center">
          <BoardColumn className={evalEnabled ? "items-end" : "items-center"}>
            <Board
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
              autoQueen={true}
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
          <div className="shadow-md">
            <EvalInfo
              evaler={evaler}
              enabled={evalEnabled}
              setEnabled={setEvalEnabled}
              moveKey={evalEnabled ? debouncedNode?.key || "root" : "disabled"}
              currentGame={currentGame}
            />
          </div>
          <div className="w-full grow relative bg-white/[0.05]">
            <ScrollContainer>
              <VarationTree
                mainLine={mainLine}
                selectedKey={currentKey}
                setSelectedKey={setCurrentKey}
                path={path}
              />
            </ScrollContainer>
          </div>
          <div className="w-full border-t border-white/[0.2] ">
            <Tab.Group>
              <Tab.List className="flex bg-[#121212] pt-1 shadow-lg">
                <StyledTab>
                  <p>
                    <MdModeComment className="inline mr-1" /> Comment
                  </p>
                </StyledTab>
                <StyledTab>
                  <p>
                    <FaExclamationCircle className="inline mr-1" /> Annotate
                  </p>
                </StyledTab>
                <StyledTab>
                  <p>
                    <BsShareFill className="inline mr-1 mb-1 text-sm" /> Share
                  </p>
                </StyledTab>
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel>
                  <Comments
                    key={currentNode?.key || "none"}
                    node={currentNode}
                    controls={commentControls}
                  />
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
              </Tab.Panels>
            </Tab.Group>
          </div>

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
          "w-32 rounded-t-md py-1 text-md text-white/[0.7] px-4",
          "focus:outline-none ",
          selected
            ? "bg-[#202020]"
            : "bg-[#181818] text-white/[0.5] hover:bg-[#202020] hover:text-white"
        )
      }
    >
      {children}
    </Tab>
  );
}

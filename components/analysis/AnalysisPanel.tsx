import React, { useState } from "react";
import { AnalysisHook } from "@/hooks/useAnalysisBoard";
import { Tab } from "@headlessui/react";
import EvalInfo from "./EvalInfo";
import { ScrollContainer } from "../layout/GameLayout";
import VarationTree from "./VarationTree";
import { MdModeComment, MdExpandMore } from "react-icons/md";
import { FaExclamationCircle } from "react-icons/fa";
import { VscCollapseAll, VscExpandAll } from "react-icons/vsc";
import { BsShareFill } from "react-icons/bs";
import Comments from "./Comments";
import Annotations from "./Annotations";
import Share from "./Share";
interface Props {
  analysis: AnalysisHook;
  boardRef: React.RefObject<HTMLDivElement>;
}
export default function AnalysisPanel({ analysis, boardRef }: Props) {
  const [expanded, setExpanded] = useState(true);
  const {
    onMove,
    evalEnabled,
    setEvalEnabled,
    evaler,
    debouncedNode,
    currentGame,
    rootNodes,
    mainLine,
    currentKey,
    setCurrentKey,
    path,
    currentNode,
    moveText,
    commentControls,
    setMoveQueue,
  } = analysis;

  const attemptMoves = (moves: string[]) => {
    setMoveQueue(moves);
  };
  return (
    <>
      <div className="shadow-md">
        <EvalInfo
          evaler={evaler}
          enabled={evalEnabled}
          setEnabled={setEvalEnabled}
          moveKey={evalEnabled ? debouncedNode?.key || "root" : "disabled"}
          currentGame={currentGame}
          attemptMoves={attemptMoves}
        />
      </div>
      <div className="w-full grow relative bg-white/[0.05]">
        <ScrollContainer>
          <VarationTree
            rootNodes={rootNodes}
            mainLine={mainLine}
            selectedKey={currentKey}
            setSelectedKey={setCurrentKey}
            path={path}
          />
        </ScrollContainer>
      </div>
      <div className="w-full border-t border-white/[0.2] ">
        <Tab.Group>
          <Tab.List className="flex bg-[#121212] pt-1 shadow-lg relative">
            <button
              className={`absolute right-2 top-0 bottom-0 flex flex-col justify-center text-white/[0.8] hover:text-white`}
              onClick={() => {
                setExpanded((x) => !x);
              }}
            >
              {expanded ? <VscCollapseAll className="" /> : <VscExpandAll />}
            </button>
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
          <Tab.Panels className={expanded ? "" : "hidden"}>
            <Tab.Panel>
              <Comments
                key={currentNode?.key || "none"}
                node={currentNode}
                controls={commentControls}
              />
            </Tab.Panel>
            <Tab.Panel>
              <Annotations />
            </Tab.Panel>
            <Tab.Panel>
              <Share boardRef={boardRef} pgn={moveText} fen={currentGame.fen} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </>
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
function CommentsPanel() {}

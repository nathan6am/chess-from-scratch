import { AnalysisHook } from "@/hooks/useAnalysisBoard";
import React from "react";
import { FaChessBoard, FaArchive, FaPaste } from "react-icons/fa";
import { ImFolderUpload, ImFolder } from "react-icons/im";
import { Disclosure, Transition } from "@headlessui/react";
import { MdExpandMore, MdDelete } from "react-icons/md";
import { BoardEditorHook } from "@/hooks/useBoardEditor";

import { IoMdAdd } from "react-icons/io";
import { BoardHandle } from "@/components/game/Board";
import PgnUpload from "@/components/analysis/PgnUpload";
import GameSearch from "@/components/menu/GameSearch";
import BrowseAnalyses from "@/components/menu/BrowseAnalyses";
import { useState } from "react";
import { Input } from "@/components/UIKit";

import FenInput from "@/components/analysis/FenInput";
import EditorPanel from "./EditorPanel";
import FileBrowserPanel from "./FileBrowserPanel";
import GameArchivePanel from "./GameArchivePanel";
interface Props {
  analysis: AnalysisHook;
  boardRef: React.RefObject<BoardHandle>;
  boardEditor: BoardEditorHook;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  flipBoard: () => void;
}
export default function NewAnalysisPanel({ analysis, boardRef, boardEditor, editMode, setEditMode, flipBoard }: Props) {
  const [panel, setPanel] = useState<"main" | "open" | "games">("main");
  return (
    <div className="bg-elevation-2 w-full h-full">
      {editMode ? (
        <EditorPanel
          boardEditor={boardEditor}
          boardRef={boardRef}
          onAnalyze={(fen: string) => {
            analysis.loadFen(fen);
            setEditMode(false);
          }}
          onPlayComputer={() => {}}
          onPlayFriend={() => {}}
          setEditMode={setEditMode}
          flipBoard={flipBoard}
        />
      ) : (
        <>
          {panel === "main" && (
            <>
              <div className="bg-elevation-3 shadow p-4">
                <h2 className="text-lg font-semibold text-light-100 text-center">
                  <IoMdAdd className="inline mr-2 text-gold-200 mb-0.5" />
                  New Analysis
                </h2>
              </div>
              <div className="flex flex-col p-3 gap-y-3 divide-white/[0.1]">
                <p className="p-6 border-b border-white/[0.1]">Make Moves or...</p>

                <button
                  onClick={() => {
                    setEditMode(true);
                  }}
                  className="p-3 px-4 flex font-medium flex-row justify-between rounded-md bg-elevation-3 text-left text-light-200  hover:bg-elevation-4 hover:text-light-100"
                >
                  <span>
                    <FaChessBoard className="inline mr-2 text-gold-200" />
                    Set Up Board
                  </span>
                  <MdExpandMore
                    className={`text-gold-200 transition-transform duration-400 mt-[1px] text-xl rotate-[-90deg]
              }`}
                  />
                </button>

                <StyledDiclosure icon={ImFolderUpload} label="Import PGN">
                  <PgnUpload loadPgn={analysis.loadPgn} />
                </StyledDiclosure>
                <StyledDiclosure icon={FaPaste} label="Paste FEN">
                  <FenInput
                    onEnter={(fen) => {
                      analysis.loadFen(fen);
                    }}
                    buttonLabel="Analyze"
                  />
                </StyledDiclosure>
                <button
                  onClick={() => {
                    setPanel("open");
                  }}
                  className="p-3 px-4 flex flex-row justify-between rounded-md bg-elevation-3 text-left text-light-200  hover:bg-elevation-4 hover:text-light-100"
                >
                  <span>
                    <ImFolder className="inline mr-2 text-gold-200" />
                    Saved Analyses
                  </span>
                  <MdExpandMore
                    className={`text-gold-200 transition-transform duration-400 mt-[1px] text-xl rotate-[-90deg]
              }`}
                  />
                </button>
                <button
                  onClick={() => {
                    setPanel("games");
                  }}
                  className="p-3 px-4 flex flex-row justify-between rounded-md bg-elevation-3 text-left text-light-200  hover:bg-elevation-4 hover:text-light-100"
                >
                  <span>
                    <FaArchive className="inline mr-2 text-gold-200" />
                    Game Archive
                  </span>
                  <MdExpandMore
                    className={`text-gold-200 transition-transform duration-400 mt-[1px] text-xl rotate-[-90deg]
              }`}
                  />
                </button>
              </div>
            </>
          )}
          {panel === "open" && (
            <>
              <FileBrowserPanel
                onBack={() => {
                  setPanel("main");
                }}
              />
            </>
          )}
          {panel === "games" && (
            <>
              <GameArchivePanel
                onBack={() => {
                  setPanel("main");
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function PasteFen() {
  const [fen, setFen] = useState("");
  return <Input label="Paste or input FEN" />;
}

interface StyledDisclosureProps {
  label: string;
  icon: React.FC<any>;
  children: JSX.Element | string | Array<JSX.Element | string>;
}

function StyledDiclosure({ children, label, icon: Icon }: StyledDisclosureProps) {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex justify-between w-full px-4 py-3  font-medium text-left text-light-200  rounded-md hover:text-light-100 bg-elevation-3 hover:bg-elevation-4 focus:outline-none focus-visible:ring focus-visible:ring-white focus-visible:ring-opacity-75">
            <span>
              <Icon className="mr-2 inline text-gold-200" />
              {label}
            </span>
            <MdExpandMore
              className={`text-gold-200 transition-transform duration-400 mt-[1px] text-xl ${
                open ? "" : "rotate-[-90deg]"
              }`}
            />
          </Disclosure.Button>
          <Transition show={open} enter="transition ease-out duration-500" enterFrom="opacity-0" enterTo="opacity-100">
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-white/[0.8]">{children}</Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}

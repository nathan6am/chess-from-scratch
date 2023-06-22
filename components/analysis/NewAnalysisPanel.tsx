import { AnalysisHook } from "@/hooks/useAnalysisBoard";
import React from "react";
import { FaChessBoard, FaArchive, FaPaste } from "react-icons/fa";
import { ImFolderUpload, ImFolder } from "react-icons/im";
import { Disclosure, Transition } from "@headlessui/react";
import { MdExpandMore, MdDelete } from "react-icons/md";
import { BoardEditorHook } from "@/hooks/useBoardEditor";
import { RiArrowGoBackFill } from "react-icons/ri";
import BoardSetupPanel from "./BoardSetupPanel";
import { IoMdAdd } from "react-icons/io";
import { BoardHandle } from "../game/Board";
import PgnUpload from "./PgnUpload";
import { BiReset } from "react-icons/bi";
import { useState } from "react";
import { Toggle, Select, Input } from "../UIKit";
import { FiRepeat } from "react-icons/fi";
import FenInput from "./FenInput";
import { on } from "events";
interface Props {
  analysis: AnalysisHook;
  boardRef: React.RefObject<BoardHandle>;
  boardEditor: BoardEditorHook;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  flipBoard: () => void;
}
export default function NewAnalysisPanel({ analysis, boardRef, boardEditor, editMode, setEditMode, flipBoard }: Props) {
  return (
    <div className="bg-elevation-2 w-full h-full">
      {editMode ? (
        <BoardEditor
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
          <div className="bg-elevation-3 shadow p-4">
            <h2 className="text-lg font-semibold text-light-100 text-center">
              <IoMdAdd className="inline mr-2 text-gold-200 mb-0.5" />
              New Analysis
            </h2>
          </div>
          <div className="flex flex-col p-3 gap-y-3 divide-white/[0.1]">
            <p className="p-6 border-b border-white/[0.1]">Make Moves or...</p>
            <Disclosure></Disclosure>
            <button
              onClick={() => {
                setEditMode(true);
              }}
              className="p-3 px-4 flex flex-row justify-between rounded-md bg-elevation-3 text-left text-light-200  hover:bg-elevation-4 hover:text-light-100"
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
            <StyledDiclosure icon={ImFolder} label="Saved Analyses">
              <p>Saved Analyses</p>
            </StyledDiclosure>
            <StyledDiclosure icon={FaArchive} label="Game Archive">
              <p>Game Archive</p>
            </StyledDiclosure>
          </div>
        </>
      )}
    </div>
  );
}

function PasteFen() {
  const [fen, setFen] = useState("");
  return <Input label="Paste or input FEN" />;
}

interface EditorProps {
  boardEditor: BoardEditorHook;
  boardRef: React.RefObject<BoardHandle>;
  onAnalyze: (fen: string) => void;
  onPlayComputer: (fen: string) => void;
  onPlayFriend: (fen: string) => void;
  flipBoard: () => void;
  setEditMode?: (value: boolean) => void;
}
export function BoardEditor({ boardEditor, boardRef, onAnalyze, setEditMode, flipBoard }: EditorProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white/[0.1] p-4 flex flex-row shadow-lg relative">
        <div className="absolute left-0 top-0 bottom-0 flex flex-row items-center gap-x-2 px-4">
          {setEditMode !== undefined && (
            <button
              className="flex flex-row items-center mr-4 text-white/[0.8] hover:text-white text-xl"
              onClick={() => {
                setEditMode(false);
              }}
            >
              <RiArrowGoBackFill className="mr-2" />
              {/* <span className="text-sm">Back</span> */}
            </button>
          )}
        </div>
        <h2 className="text-lg font-semibold text-white text-center w-full">Board Editor</h2>
      </div>
      <div className="bg-elevation-3/[0.7]  p-3">
        <BoardSetupPanel boardHandle={boardRef} boardEditor={boardEditor} />
      </div>

      <div className="flex flex-col p-3 px-6 ">
        <div className="flex flex-row justify-around gap-x-4 mb-4">
          <button
            onClick={() => {
              boardEditor.clearBoard();
            }}
            className="w-full p-3 px-4 text-center flex flex-row justify-center rounded-md bg-elevation-3 text-left text-light-200 hover:text-gold-100 hover:bg-elevation-4 shadow-md"
          >
            <span className="flex flex-row items-center">
              <MdDelete className="inline mr-2 text-lg" />
              Clear Board
            </span>
          </button>
          <button
            onClick={() => {
              boardEditor.resetToStartPosition();
            }}
            className="w-full text-center p-3 px-4 flex flex-row justify-center rounded-md bg-elevation-3 text-left text-light-200 hover:text-gold-100 hover:bg-elevation- shadow-md"
          >
            <span className="flex flex-row items-center ">
              <BiReset className="inline mr-2 text-lg" />
              Start Position
            </span>
          </button>
        </div>
        <div className="flex flex-row justify-between items-center mb-4">
          <Select
            className="grow"
            options={[
              { label: "White to Play", value: "w" },
              { label: "Black to Play", value: "b" },
            ]}
            value={boardEditor.activeColor}
            onChange={boardEditor.setActiveColor}
          />
          <button onClick={flipBoard} className="shrink-0  text-light-200 hover:text-gold-200 py-3 px-4">
            <FiRepeat className="mr-2 inline" /> Flip Board
          </button>
        </div>
        {/* <label className="block text-white text-md mb-2">Castle Rights</label> */}
        <div className="grid grid-cols-2 gap-x-8">
          <div className="flex flex-col gap-y-2 pr-4">
            <label className="block text-white/[0.6] text-md font-semibold">White</label>
            <Toggle
              label="Queen Side (O-O-O)"
              checked={boardEditor.castleRights.w.kingSide}
              onChange={(enabled) => {
                boardEditor.setCastleRights((prev) => ({
                  ...prev,
                  w: { ...prev.w, kingSide: enabled },
                }));
              }}
              disabled={boardEditor.disabledCastling.w.queenSide}
            />
            <Toggle
              label="King Side (O-O)"
              checked={boardEditor.castleRights.w.queenSide}
              onChange={(enabled) => {
                boardEditor.setCastleRights((prev) => ({
                  ...prev,
                  w: { ...prev.w, queenSide: enabled },
                }));
              }}
              disabled={boardEditor.disabledCastling.w.kingSide}
            />
          </div>
          <div className="flex flex-col gap-y-2 pr-4">
            <label className="block text-white/[0.6] text-md font-semibold">Black</label>
            <Toggle
              label="Queen Side (O-O-O)"
              checked={boardEditor.castleRights.b.kingSide}
              onChange={(enabled) => {
                boardEditor.setCastleRights((prev) => ({
                  ...prev,
                  b: { ...prev.b, kingSide: enabled },
                }));
              }}
              disabled={boardEditor.disabledCastling.b.queenSide}
            />
            <Toggle
              label="King Side (O-O)"
              checked={boardEditor.castleRights.b.queenSide}
              onChange={(enabled) => {
                boardEditor.setCastleRights((prev) => ({
                  ...prev,
                  b: { ...prev.b, queenSide: enabled },
                }));
              }}
              disabled={boardEditor.disabledCastling.b.kingSide}
            />
          </div>
        </div>
        <p>Valid? {boardEditor.isValid}</p>
        <button
          onClick={() => {
            if (boardEditor.isValid === true) {
              onAnalyze(boardEditor.fen);
            }
          }}
        >
          Analyze
        </button>
      </div>
    </div>
  );
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

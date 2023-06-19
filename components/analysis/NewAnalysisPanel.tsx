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
import Select from "../UI/Select";
import { Toggle } from "../UIKit";
import { FiRepeat } from "react-icons/fi";
interface Props {
  analysis: AnalysisHook;
  boardRef: React.RefObject<BoardHandle>;
  boardEditor: BoardEditorHook;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  flipBoard: () => void;
}
export default function NewAnalysisPanel({
  analysis,
  boardRef,
  boardEditor,
  editMode,
  setEditMode,
  flipBoard,
}: Props) {
  return (
    <div className="bg-[#242424] w-full h-full">
      {editMode ? (
        <BoardEditor
          boardEditor={boardEditor}
          boardRef={boardRef}
          analysis={analysis}
          setEditMode={setEditMode}
          flipBoard={flipBoard}
        />
      ) : (
        <>
          <div className="bg-white/[0.1] p-4">
            <h2 className="text-lg font-semibold text-white text-center">
              <IoMdAdd className="inline mr-2" />
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
              className="p-3 px-4 flex flex-row justify-between rounded-md bg-white/[0.05] text-left text-white/[0.8] hover:text-white hover:bg-white/[0.1]"
            >
              <span>
                <FaChessBoard className="inline mr-2" />
                Set Up Board
              </span>
              <MdExpandMore
                className={`text-sepia transition-transform duration-400 mt-[1px] text-xl rotate-[-90deg]
              }`}
              />
            </button>

            <StyledDiclosure icon={ImFolderUpload} label="Import PGN">
              <PgnUpload loadPgn={analysis.loadPgn} />
            </StyledDiclosure>
            <StyledDiclosure icon={FaPaste} label="Paste FEN">
              <p>Paste FEN</p>
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

interface EditorProps {
  boardEditor: BoardEditorHook;
  boardRef: React.RefObject<BoardHandle>;
  analysis: AnalysisHook;
  flipBoard: () => void;
  setEditMode: (value: boolean) => void;
}
export function BoardEditor({
  boardEditor,
  boardRef,
  analysis,
  setEditMode,
  flipBoard,
}: EditorProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white/[0.1] p-4 flex flex-row shadow-lg relative">
        <div className="absolute left-0 top-0 bottom-0 flex flex-row items-center gap-x-2 px-4">
          <button
            className="flex flex-row items-center mr-4 text-white/[0.8] hover:text-white text-xl"
            onClick={() => {
              setEditMode(false);
            }}
          >
            <RiArrowGoBackFill className="mr-2" />
            {/* <span className="text-sm">Back</span> */}
          </button>
        </div>
        <h2 className="text-lg font-semibold text-white text-center w-full">Board Editor</h2>
      </div>
      <div className="bg-[#303030]  p-3">
        <BoardSetupPanel boardHandle={boardRef} boardEditor={boardEditor} />
      </div>

      <div className="flex flex-col p-3 px-6 ">
        <div className="flex flex-row justify-around gap-x-4 mb-4">
          <button
            onClick={() => {
              boardEditor.clearBoard();
            }}
            className="w-full p-3 px-4 text-center flex flex-row justify-center rounded-md bg-white/[0.05] text-left text-white/[0.8] hover:text-white hover:bg-white/[0.1] shadow-md"
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
            className="w-full text-center p-3 px-4 flex flex-row justify-center rounded-md bg-white/[0.05] text-left text-white/[0.8] hover:text-white hover:bg-white/[0.1] shadow-md"
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
          <button
            onClick={flipBoard}
            className="shrink-0  text-white/[0.8] hover:text-white py-3 mt-1 px-4"
          >
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
              analysis.loadFen(boardEditor.fen);
              setEditMode(false);
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
          <Disclosure.Button className="flex justify-between w-full px-4 py-3  font-medium text-left text-white/[0.8] bg-white/[0.05] rounded-md hover:text-white hover:bg-white/[0.1] focus:outline-none focus-visible:ring focus-visible:ring-white focus-visible:ring-opacity-75">
            <span>
              <Icon className="mr-2 inline" />
              {label}
            </span>
            <MdExpandMore
              className={`text-sepia transition-transform duration-400 mt-[1px] text-xl ${
                open ? "" : "rotate-[-90deg]"
              }`}
            />
          </Disclosure.Button>
          <Transition
            show={open}
            enter="transition ease-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
          >
            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-white/[0.8]">
              {children}
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
}

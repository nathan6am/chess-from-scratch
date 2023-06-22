import React from "react";
import { RiArrowGoBackFill } from "react-icons/ri";
import { BoardEditorHook } from "@/hooks/useBoardEditor";
import { BoardHandle } from "../game/Board";
import BoardSetupPanel from "./BoardSetupPanel";
import * as Chess from "@/lib/chess";
import { MdDelete } from "react-icons/md";
import { BiReset } from "react-icons/bi";
import { FiRepeat } from "react-icons/fi";
import { Select, Toggle, Input } from "../UIKit";

interface EditorProps {
  boardEditor: BoardEditorHook;
  boardRef: React.RefObject<BoardHandle>;
  onAnalyze: (fen: string) => void;
  onPlayComputer: (fen: string) => void;
  onPlayFriend: (fen: string) => void;
  flipBoard: () => void;
  setEditMode?: (value: boolean) => void;
}
export default function EditorPanel({ boardEditor, boardRef, onAnalyze, setEditMode, flipBoard }: EditorProps) {
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

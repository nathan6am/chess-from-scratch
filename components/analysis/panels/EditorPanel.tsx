import React, { useState } from "react";

//Types
import { BoardHandle } from "@/components/board/Board";
import { BoardEditorHook } from "@/hooks/useBoardEditor";

//Components
import { Select, Toggle, Button, NumericInput } from "@/components/base";
import BoardSetupPanel from "./BoardSetupPanel";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

//Icons
import { RiArrowGoBackFill } from "react-icons/ri";
import { MdDelete } from "react-icons/md";
import { BiReset } from "react-icons/bi";
import { FiRepeat } from "react-icons/fi";
import { WhiteIcon, BlackIcon } from "@/components/icons";
import { RiErrorWarningFill } from "react-icons/ri";

interface EditorProps {
  boardEditor: BoardEditorHook;
  boardRef: React.RefObject<BoardHandle>;
  onAnalyze: (fen: string) => void;
  onPlayComputer: (fen: string) => void;
  onPlayFriend: (fen: string) => void;
  flipBoard: () => void;
  setEditMode?: (value: boolean) => void;
  showOverwriteWarning?: boolean;
}
export default function EditorPanel({
  boardEditor,
  boardRef,
  onAnalyze,
  setEditMode,
  flipBoard,
  showOverwriteWarning,
}: EditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <div className="flex flex-col h-full">
      <ConfirmationDialog
        title="Load Position"
        message="Editing the live position will overwrite the exsiting move tree. Are you sure you want to continue?"
        onConfirm={() => {
          setDialogOpen(false);
          onAnalyze(boardEditor.fen);
        }}
        onCancel={() => {
          setDialogOpen(false);
        }}
        isOpen={dialogOpen}
        closeModal={() => setDialogOpen(false)}
        confirmText="Continue"
        cancelText="Cancel"
      />
      <div className="bg-white/[0.1] p-4 flex flex-row shadow-lg relative">
        <div className="absolute left-0 top-0 bottom-0 flex flex-row items-center gap-x-2 px-4">
          {setEditMode && (
            <button
              className="flex flex-row items-center mr-4 text-white/[0.8] hover:text-white text-xl"
              onClick={() => {
                setEditMode(false);
              }}
            >
              <RiArrowGoBackFill className="mr-2" />
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
              Reset
            </span>
          </button>
        </div>
        <div className="flex flex-row justify-between items-center mb-4">
          <Select
            className="grow"
            options={[
              { label: "White to Play", value: "w", icon: WhiteIcon },
              { label: "Black to Play", value: "b", icon: BlackIcon },
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
        <div className="grid grid-cols-2 gap-x-2 my-4">
          <NumericInput
            value={boardEditor.halfMoveCount}
            min={0}
            max={Math.min(99, boardEditor.fullMoveCount * 2 - 1)}
            onChange={boardEditor.setHalfMoveCount}
            label="Half Move Count"
          />
          <NumericInput
            value={boardEditor.fullMoveCount}
            min={1}
            max={999}
            onChange={boardEditor.setFullMoveCount}
            label="Full Move Count"
          />
        </div>
        {boardEditor.isValid !== true && (
          <p className="text-sm text-danger-300 my-1">
            <span>
              <RiErrorWarningFill className="inline mr-1 mb-1" />
            </span>
            Invalid position: {boardEditor.isValid}
          </p>
        )}
        <div className="w-full gap-y-4 flex flex-col">
          <Button
            disabled={boardEditor.isValid !== true}
            variant="primary"
            width="full"
            label="Load Position"
            onClick={() => {
              if (boardEditor.isValid === true) {
                if (showOverwriteWarning) {
                  setDialogOpen(true);
                } else {
                  onAnalyze(boardEditor.fen);
                }
              }
            }}
          ></Button>
          {/* <Button
            disabled={boardEditor.isValid !== true}
            variant="neutral"
            label="Practice vs Computer"
            onClick={() => {
              if (boardEditor.isValid === true) {
              }
            }}
          ></Button>
          <Button
            disabled={boardEditor.isValid !== true}
            variant="neutral"
            label="Practice vs Friend"
            onClick={() => {
              if (boardEditor.isValid === true) {
              }
            }}
          ></Button> */}
        </div>
      </div>
    </div>
  );
}

import React from "react";

//Components
import Board, { BoardHandle } from "../board/Board";
import { BoardRow, BoardColumn, PanelColumnLg } from "../layout/GameLayout";

import useBoardEditor from "@/hooks/useBoardEditor";
import { SettingsContext } from "@/context/settings";
import { useContext } from "react";

import EditorPanel from "./panels/EditorPanel";
export default function BoardEditor() {
  const boardRef = React.useRef<BoardHandle>(null);
  const { settings } = useContext(SettingsContext);
  const editor = useBoardEditor();
  const [orientation, setOrientation] = React.useState<"w" | "b">("w");
  return (
    <div className="flex flex-col h-full w-full justify-center">
      <BoardRow>
        <div className="flex flex-row h-fit basis-[100vh] justify-center md:pl-4">
          <BoardColumn className="items-center relative">
            <Board
              showCoordinates={settings.display.showCoordinates}
              movementType={settings.gameBehavior.movementType}
              theme={settings.display.boardTheme}
              pieceSet={settings.display.pieceTheme}
              ref={boardRef}
              orientation={orientation}
              legalMoves={[]}
              showHighlights={false}
              showTargets={false}
              pieces={editor.board}
              animationSpeed={settings.display.animationSpeed}
              lastMove={null}
              activeColor={"w"}
              moveable={"both"}
              preMoveable={false}
              autoQueen={settings.gameBehavior.autoQueen}
              onMove={() => {}}
              onPremove={() => {}}
              disableArrows
              editMode
              onMovePiece={editor.onMovePiece}
              onAddPiece={editor.onAddPiece}
              onRemovePiece={editor.onRemovePiece}
              pieceCursor={editor.pieceCursor}
            />
          </BoardColumn>
        </div>

        <PanelColumnLg className="bg-[#1f1f1f]">
          <EditorPanel
            boardEditor={editor}
            boardRef={boardRef}
            flipBoard={() => {
              setOrientation(orientation === "w" ? "b" : "w");
            }}
            onAnalyze={(fen) => {
              console.log("Analyze", fen);
            }}
            onPlayComputer={() => {}}
            onPlayFriend={() => {}}
          />
        </PanelColumnLg>
      </BoardRow>
    </div>
  );
}

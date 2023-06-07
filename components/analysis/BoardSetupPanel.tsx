import { useCallback } from "react";
import { BoardHandle } from "../game/Board";
import * as Chess from "@/lib/chess";

interface SetupPanelProps {
  boardHandle: React.RefObject<BoardHandle>;
  //   clearBoard: () => void;
  //   setFen: (fen: string) => void;
  //   setPgn: (pgn: string) => void;
  //   setSelectedPiece: (piece: Chess.Piece) => void;
}

export default function SetupPanel({ boardHandle }: SetupPanelProps) {
  const spawnDraggable = useCallback(
    (piece: Chess.Piece, e: React.MouseEvent<HTMLElement>) => {
      boardHandle.current?.spawnDraggablePiece(piece, e);
    },
    [boardHandle]
  );

  return (
    <div className="w-full ">
      <PieceSelect spawnDraggable={spawnDraggable} />
    </div>
  );
}

function PieceSelect({ spawnDraggable }: { spawnDraggable: any }) {
  const types: Chess.PieceType[] = ["p", "n", "b", "r", "q", "k"];
  const colors: Chess.Color[] = ["w", "b"];
  return (
    <div className="grid grid-cols-6 gap-2">
      {colors.map((color) => {
        return types.map((type) => {
          return <PieceButton piece={{ color, type, key: `${color}${type}` }} spawnDraggable={spawnDraggable} />;
        });
      })}
    </div>
  );
}

function PieceButton({ piece, spawnDraggable }: { piece: Chess.Piece; spawnDraggable: any }) {
  return (
    <button
      className={`${piece.color}${piece.type} aspect-square w-full bg-cover bg-center bg-no-repeat`}
      onMouseDown={(e) => spawnDraggable(piece, e)}
    ></button>
  );
}

import { useCallback, useMemo } from "react";

//Types
import { BoardHandle } from "@/components/board/Board";
import { BoardEditorHook } from "@/hooks/useBoardEditor";

//Icons
import { BsFillHandIndexFill, BsFillEraserFill } from "react-icons/bs";

//Util
import * as Chess from "@/lib/chess";
import cn from "@/util/cn";
import _ from "lodash";

/**
 * Board Setup Panel for setting up a custom board position
 */
interface SetupPanelProps {
  /**
   * Reference to the board handle (for imperatively controlling the board)
   */
  boardHandle: React.RefObject<BoardHandle>;
  /**
   * Hook for editing the board state
   */
  boardEditor: BoardEditorHook;
}

export default function BoardSetupPanel({ boardHandle, boardEditor }: SetupPanelProps) {
  const spawnDraggable = useCallback(
    (piece: Chess.Piece, e: React.MouseEvent<HTMLElement>) => {
      boardHandle.current?.spawnDraggablePiece(piece, e);
    },
    [boardHandle]
  );

  return (
    <div className="w-full ">
      <PieceSelect spawnDraggable={spawnDraggable} boardEditor={boardEditor} />
    </div>
  );
}

const PIECE_TYPES: Chess.PieceType[] = ["p", "n", "b", "r", "q", "k"];
function PieceSelect({ spawnDraggable, boardEditor }: { spawnDraggable: any; boardEditor: BoardEditorHook }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      <>
        {PIECE_TYPES.map((type) => {
          const color = "w";
          return (
            <PieceButton
              key={`${color}${type}`}
              piece={{ color, type, key: `${color}${type}` }}
              spawnDraggable={spawnDraggable}
              pieceCursor={boardEditor.pieceCursor}
              setPieceCursor={boardEditor.setPieceCursor}
            />
          );
        })}
        <button
          onClick={() => {
            boardEditor.setPieceCursor(null);
          }}
          className={cn("rounded-lg relative aspect-square w-full pb-2 px-1 border-2", {
            "bg-white/[0.1] border-gold-100": !boardEditor.pieceCursor,
            "border-transparent": boardEditor.pieceCursor,
          })}
        >
          <div className="aspect-square flex justify-center items-center">
            <BsFillHandIndexFill
              className={cn("text-4xl mt-1.5 mr-1.5", {
                "text-success-500": !boardEditor.pieceCursor,
                "text-light-300": boardEditor.pieceCursor,
              })}
            />
          </div>
        </button>
      </>
      <>
        {PIECE_TYPES.map((type) => {
          const color = "b";
          return (
            <PieceButton
              key={`${color}${type}`}
              piece={{ color, type, key: `${color}${type}` }}
              spawnDraggable={spawnDraggable}
              pieceCursor={boardEditor.pieceCursor}
              setPieceCursor={boardEditor.setPieceCursor}
            />
          );
        })}
        <button
          onClick={() => {
            boardEditor.setPieceCursor((cur) => (cur === "remove" ? null : "remove"));
          }}
          className={cn("rounded-lg relative aspect-square w-full pb-2 px-1 border-2", {
            "bg-white/[0.1] border-gold-100": boardEditor.pieceCursor === "remove",
            "border-transparent": boardEditor.pieceCursor !== "remove",
          })}
        >
          <div className="aspect-square flex justify-center items-center">
            <BsFillEraserFill
              className={cn("text-4xl mt-1.5 mr-1", {
                "text-red-400": boardEditor.pieceCursor === "remove",
                "text-light-300": boardEditor.pieceCursor !== "remove",
              })}
            />
          </div>
        </button>
      </>
    </div>
  );
}

interface PieceButtonProps {
  piece: Chess.Piece;
  spawnDraggable: any;
  setPieceCursor: React.Dispatch<React.SetStateAction<Chess.Piece | "remove" | null>>;
  pieceCursor: Chess.Piece | "remove" | null;
}
function PieceButton({ piece, spawnDraggable, pieceCursor, setPieceCursor }: PieceButtonProps) {
  const selected = useMemo(() => {
    if (pieceCursor === "remove") return false;
    if (pieceCursor === null) return false;
    return pieceCursor.type === piece.type && pieceCursor.color === piece.color;
  }, [pieceCursor, piece]);
  return (
    <button
      className={cn("rounded-lg relative aspect-square w-full pb-2 px-1 border-2", {
        "bg-white/[0.1] border-gold-100": selected,
        "border-transparent": !selected,
      })}
      onMouseDown={(e) => spawnDraggable(piece, e)}
      onClick={() => {
        setPieceCursor((prev) => {
          if (prev === null) return piece;
          if (prev === "remove") return piece;
          if (prev.type === piece.type && prev.color === piece.color) return null;
          return piece;
        });
      }}
    >
      {/* {selected && <div className="absolute top-[-4px] left-[-4px] w-8 h-8 bg-white/[0.1]"></div>} */}
      <div className={cn("bg-cover bg-center bg-no-repeat aspect-square w-full", `${piece.color}${piece.type}`, {})} />
    </button>
  );
}

import { useCallback, useMemo } from "react";
import { BoardHandle } from "../game/Board";
import * as Chess from "@/lib/chess";
import classNames from "classnames";
import _ from "lodash";
import { BoardEditorHook } from "@/hooks/useBoardEditor";

interface SetupPanelProps {
  boardHandle: React.RefObject<BoardHandle>;
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

function PieceSelect({
  spawnDraggable,
  boardEditor,
}: {
  spawnDraggable: any;
  boardEditor: BoardEditorHook;
}) {
  const types: Chess.PieceType[] = ["p", "n", "b", "r", "q", "k"];
  const colors: Chess.Color[] = ["w", "b"];
  return (
    <div className="grid grid-cols-7 gap-2">
      <>
        {types.map((type) => {
          const color = "w";
          return (
            <PieceButton
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
          className={classNames("rounded-lg relative aspect-square w-full pb-2 px-1 border-2", {
            "bg-white/[0.1] border-sepia": !boardEditor.pieceCursor,
            "border-transparent": boardEditor.pieceCursor,
          })}
        >
          <div className="aspect-square">HAND</div>
        </button>
      </>
      <>
        {types.map((type) => {
          const color = "b";
          return (
            <PieceButton
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
          className={classNames("rounded-lg relative aspect-square w-full pb-2 px-1 border-2", {
            "bg-white/[0.1] border-sepia": boardEditor.pieceCursor === "remove",
            "border-transparent": boardEditor.pieceCursor !== "remove",
          })}
        >
          <div className="aspect-square">ERASE</div>
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
      className={classNames("rounded-lg relative aspect-square w-full pb-2 px-1 border-2", {
        "bg-white/[0.1] border-sepia": selected,
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
      <div
        className={classNames(
          "bg-cover bg-center bg-no-repeat aspect-square w-full",
          `${piece.color}${piece.type}`,
          {}
        )}
      />
    </button>
  );
}

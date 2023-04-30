import React, { useRef, useEffect, useMemo } from "react";

//Util
import { notEmpty } from "@/util/misc";
import * as Chess from "@/lib/chess";
enum PieceChars {
  bq = "♕",
  bk = "♔",
  bb = "♗",
  br = "♖",
  bp = "♙",
  bn = "♘",
  wk = "♚",
  wq = "♛",
  wb = "♝",
  wn = "♞",
  wr = "♜",
  wp = "♟",
}
//Convert PGN to use piece characters
export function replacePieceChars(pgn: string, color: Chess.Color): string {
  let result = pgn;
  if (pgn.charAt(0) === "O") {
    return result;
  }
  if (pgn.charAt(0) === pgn.charAt(0).toUpperCase()) {
    const key = `${color}${pgn.charAt(0).toLowerCase()}`;
    return PieceChars[key as keyof typeof PieceChars] + pgn.substring(1);
  } else {
    return pgn;
  }
}

interface Props {
  currentOffset: number;
  moveHistory: Chess.MoveHistory;
  usePieceIcons: boolean;
  jumpToOffset: (offset: number) => void;
}

export default function MoveHistory({
  moveHistory,
  usePieceIcons,
  jumpToOffset,
  currentOffset,
}: Props) {
  //Memoize the move count to trigger scroll on update
  const moveCount = useMemo(() => {
    return moveHistory.flat().filter(notEmpty).length;
  }, [moveHistory]);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [moveCount]);

  return (
    <>
      <Header />
      <div className="grow w-full relative">
        <div className="absolute top-0 left-0 bottom-0 right-0 bg-[#1f1f1f] flex flex-col border-t border-white/[0.2] overflow-y-scroll overflow-x-hidden">
          <table className="table-fixed w-full text">
            <tbody>
              {moveHistory.map((fullMove, idx) => {
                const length = moveHistory.flat().filter(notEmpty).length;
                const offset =
                  length % 2 === 0
                    ? (moveHistory.length - idx) * 2
                    : (moveHistory.length - idx) * 2 - 1;
                return (
                  <tr key={idx} className="border-b border-white/[0.1]">
                    <td className="p-1 text-center w-10 bg-white/[0.1] border-r border-white/[0.2]">{`${
                      idx + 1
                    }.`}</td>
                    <td
                      onClick={() => {
                        jumpToOffset(offset - 1);
                      }}
                      className={`p-1 px-4 cursor-pointer border-r border-white/[0.2] ${
                        currentOffset === offset - 1 ? "bg-blue-300/[0.2]" : ""
                      }`}
                    >
                      {usePieceIcons ? replacePieceChars(fullMove[0].PGN, "w") : fullMove[0].PGN}
                    </td>
                    <td
                      onClick={() => {
                        jumpToOffset(offset - 2);
                      }}
                      className={`p-1 px-4 cursor-pointer ${
                        currentOffset === offset - 2 ? "bg-blue-300/[0.2]" : ""
                      }`}
                    >
                      {fullMove[1]?.PGN
                        ? usePieceIcons
                          ? replacePieceChars(fullMove[1].PGN, "b")
                          : fullMove[1].PGN
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div ref={scrollRef} />
        </div>
      </div>
    </>
  );
}

const Header = () => (
  <div className="w-full py-1 px-4 bg-[#161616] text-sepia text-sm italic border-white/[0.2] border-t">
    Move History:
  </div>
);

export function MoveTape({ moveHistory, usePieceIcons, jumpToOffset, currentOffset }: Props) {
  //Memoize the move count to trigger scroll on update
  const moveCount = useMemo(() => {
    return moveHistory.flat().filter(notEmpty).length;
  }, [moveHistory]);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [moveCount]);
  const flattened = useMemo(() => {
    return moveHistory.flat().filter(notEmpty);
  }, [moveHistory]);
  return (
    <>
      <div className="pl-4 py-2 flex flex-row w-full overflow-x-scroll scrollbar-none bg-black/[0.5]">
        {flattened.map((move, idx) => {
          const offset = flattened.length - 1 - idx;
          return (
            <RenderMove
              key={idx}
              active={currentOffset === offset}
              onClick={() => {
                jumpToOffset(offset);
              }}
              pgn={move.PGN}
              halfMoveCount={idx + 1}
            />
          );
        })}
      </div>
    </>
  );
}

interface MoveProps {
  pgn: string;
  halfMoveCount: number;
  active: boolean;
  onClick: () => void;
}
function RenderMove({ pgn, active, onClick, halfMoveCount }: MoveProps) {
  const isWhite = halfMoveCount % 2 !== 0;
  return (
    <div className="flex flex-row text-sm">
      {isWhite && (
        <span className={` ml-[2px] opacity-50 text-white py-[1px]`}>
          {Chess.moveCountToNotation(halfMoveCount)}
        </span>
      )}
      <span
        className={`cursor-pointer  mx-[2px] py-[1px] px-[2px] rounded hover:bg-white/[0.1] text-white ${
          isWhite ? "" : "mr-[6px]"
        } ${active ? "bg-blue-400/[0.2] " : ""}`}
        onClick={onClick}
      >
        {replacePieceChars(pgn, isWhite ? "w" : "b")}
      </span>
    </div>
  );
}

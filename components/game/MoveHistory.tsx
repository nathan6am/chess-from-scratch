import React, { useRef, useEffect, useState, useMemo } from "react";
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
import { DurationObjectUnits } from "luxon";
interface Props {
  currentOffset: number;
  orientation: Chess.Color;
  moveHistory: Chess.MoveHistory;
  usePieceIcons: boolean;
  onFlipBoard: any;
  controls: {
    stepForward: () => void;
    stepBackward: () => void;
    jumpForward: () => void;
    jumpBackward: () => void;
    jumpToOffset: (offset: number) => void;
  };
  timeRemaining: Record<Chess.Color, DurationObjectUnits>;
}

import {
  AiOutlineStepForward,
  AiOutlineFastForward,
  AiOutlineStepBackward,
  AiOutlineFastBackward,
} from "react-icons/ai";

import { FaHandshake } from "react-icons/fa";

import { FiRepeat, FiFlag } from "react-icons/fi";
import { notEmpty } from "@/util/misc";

export default function MoveHistory({
  moveHistory,
  orientation,
  usePieceIcons,
  onFlipBoard,
  controls,
  timeRemaining,
  currentOffset,
}: Props) {
  const moveCount = useMemo(() => {
    return moveHistory.flat().filter(notEmpty).length;
  }, [moveHistory]);

  //Scroll to bottom on every move
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [moveCount]);

  return (
    <div className="h-full w-[320px] xl:w-[400px] flex flex-col justify-center mx-4 py-20">
      <div className="h-full max-h-[60vw] w-full  flex flex-col">
        <div className="mb-4">
          <CountdownClock
            timeRemaining={timeRemaining[orientation === "w" ? "b" : "w"]}
            color={orientation === "w" ? "b" : "w"}
          />
        </div>

        <div className="bg-[#121212] flex flex-col h-full">
          <div className="flex flex-row justify-around px-4">
            <button
              className="p-4 text-white/[0.7] hover:text-white  grow w-full"
              onClick={onFlipBoard}
            >
              <FiRepeat className="text-xl mx-auto" />
            </button>
            <button className="p-4 text-white/[0.7] hover:text-red-500 grow w-full">
              <FiFlag className="text-xl mx-auto" />
            </button>
            <button className="p-4 text-white/[0.7] hover:text-white  grow w-full">
              <FaHandshake className="text-xl mx-auto" />
            </button>
          </div>
          <div className="w-full py-1 px-4 bg-[#161616] text-sepia text-sm italic border-white/[0.2] border-t">
            Move History:
          </div>
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
                            controls.jumpToOffset(offset - 1);
                          }}
                          className={`p-1 px-4 cursor-pointer border-r border-white/[0.2] ${
                            currentOffset === offset - 1
                              ? "bg-blue-300/[0.2]"
                              : ""
                          }`}
                        >
                          {usePieceIcons
                            ? parsePGN(fullMove[0].PGN, "w")
                            : fullMove[0].PGN}
                        </td>
                        <td
                          onClick={() => {
                            controls.jumpToOffset(offset - 2);
                          }}
                          className={`p-1 px-4 cursor-pointer ${
                            currentOffset === offset - 2
                              ? "bg-blue-300/[0.2]"
                              : ""
                          }`}
                        >
                          {fullMove[1]?.PGN
                            ? usePieceIcons
                              ? parsePGN(fullMove[1].PGN, "b")
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
          <div className="flex flex-row justify-around bg-[#121212] shadow-lg">
            <button
              onClick={controls.jumpBackward}
              className="p-3 text-white/[0.7] hover:text-white hover:bg-sepia/[0.2] grow w-full"
            >
              <AiOutlineFastBackward className="text-2xl mx-auto" />
            </button>
            <button
              onClick={controls.stepBackward}
              className="p-3 text-white/[0.7] hover:text-white hover:bg-sepia/[0.2] grow w-full"
            >
              <AiOutlineStepBackward className="text-xl mx-auto" />
            </button>
            <button
              onClick={controls.stepForward}
              className="p-3 text-white/[0.7] hover:text-white hover:bg-sepia/[0.2] grow w-full"
            >
              <AiOutlineStepForward className="text-xl mx-auto" />
            </button>
            <button
              onClick={controls.jumpForward}
              className="p-3 text-white/[0.7] hover:text-white hover:bg-sepia/[0.2] grow w-full"
            >
              <AiOutlineFastForward className="text-2xl mx-auto" />
            </button>
          </div>
        </div>
        <div className="mt-10">
          <CountdownClock
            timeRemaining={timeRemaining[orientation]}
            color={orientation}
          />
        </div>
      </div>
    </div>
  );
}
export function parsePGN(pgn: string, color: Chess.Color): string {
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

interface ClockProps {
  color: Chess.Color;
  timeRemaining: DurationObjectUnits;
}
const zeroPad = (num: number, places: number) =>
  String(num).padStart(places, "0");

function CountdownClock({ color, timeRemaining }: ClockProps) {
  return (
    <h3
      className={`py-3 rounded text-xl px-8 w-fit ${
        color === "w" ? "bg-[#919191] text-black/[0.7]" : "bg-black text-white"
      }`}
    >
      {`${timeRemaining.hours || 0 > 0 ? timeRemaining.hours + ":" : ""}${
        timeRemaining.hours || 0 > 0
          ? zeroPad(timeRemaining.minutes || 0, 2)
          : timeRemaining.minutes
      }:${zeroPad(timeRemaining.seconds || 0, 2)}`}
    </h3>
  );
}

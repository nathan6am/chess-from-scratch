import React, { useRef, useEffect } from "react";
import * as Chess from "@/util/chess";
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

interface Props {
  moveHistory: Chess.MoveHistory;
  usePieceIcons: boolean;
  onFlipBoard: any;
  controls: {
    onStepForward: () => void;
    onStepBackward: () => void;
  };
}

import {
  AiOutlineStepForward,
  AiOutlineFastForward,
  AiOutlineStepBackward,
  AiOutlineFastBackward,
} from "react-icons/ai";

import { FaHandshake } from "react-icons/fa";

import { FiRepeat, FiFlag } from "react-icons/fi";

const AlwaysScrollToBottom = () => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    elementRef.current.scrollIntoView({ behavior: "smooth" });
  });
  return <div ref={elementRef} />;
};
export default function MoveHistory({ moveHistory, usePieceIcons, onFlipBoard, controls }: Props) {
  return (
    <div className="h-full w-[500px] flex flex-col justify-center mx-4">
      <div className="h-[85%] w-full  flex flex-col">
        <div className="py-4 bg-black rounded text-3xl px-10 w-fit mb-10">3:00</div>
        <div className="bg-[#1f1f1f] flex flex-col h-full">
          <div className="flex flex-row justify-around px-4">
            <button className="p-4 text-white/[0.7] hover:text-white  grow w-full" onClick={onFlipBoard}>
              <FiRepeat className="text-3xl mx-auto" />
            </button>
            <button className="p-4 text-white/[0.7] hover:text-red-500 grow w-full">
              <FiFlag className="text-3xl mx-auto" />
            </button>
            <button className="p-4 text-white/[0.7] hover:text-white  grow w-full">
              <FaHandshake className="text-3xl mx-auto" />
            </button>
          </div>
          <div className="w-full py-2 px-4 bg-white/[0.1]">Moves:</div>
          <div className="grow w-full relative">
            <div className="absolute top-0 left-0 bottom-0 right-0 bg-[#1f1f1f] flex flex-col overflow-y-scroll overflow-x-hidden">
              <table className="table-fixed w-full ">
                <tbody>
                  {moveHistory.map((fullMove, idx) => {
                    return (
                      <tr key={idx} className="border-b border-white/[0.1]">
                        <td className="p-2 px-4 w-20">{`${idx + 1}.`}</td>
                        <td className="p-2">{usePieceIcons ? parsePGN(fullMove[0].PGN, "w") : fullMove[0].PGN}</td>
                        <td className="p-2">
                          {fullMove[1]?.PGN ? (usePieceIcons ? parsePGN(fullMove[1].PGN, "b") : fullMove[1].PGN) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <AlwaysScrollToBottom />
            </div>
          </div>
          <div className="flex flex-row justify-around bg-[#121212] shadow-lg">
            <button className="p-4 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full">
              <AiOutlineFastBackward className="text-2xl mx-auto" />
            </button>
            <button
              onClick={controls.onStepBackward}
              className="p-4 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full"
            >
              <AiOutlineStepBackward className="text-xl mx-auto" />
            </button>
            <button
              onClick={controls.onStepForward}
              className="p-4 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full"
            >
              <AiOutlineStepForward className="text-xl mx-auto" />
            </button>
            <button className="p-4 text-white/[0.7] hover:text-white hover:bg-white/[0.1] grow w-full">
              <AiOutlineFastForward className="text-2xl mx-auto" />
            </button>
          </div>
        </div>
        <h3 className="py-4 bg-[#919191] text-black/[0.7] text-3xl px-10 w-fit mt-10 rounded">3:00</h3>
      </div>
    </div>
  );
}
function parsePGN(pgn: string, color: Chess.Color): string {
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

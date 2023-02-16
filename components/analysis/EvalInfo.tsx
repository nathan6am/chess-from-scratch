import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import * as Chess from "@/lib/chess";
import { Evaler } from "@/hooks/useLocalEval";
import Toggle from "../UI/Toggle";
import ProgressBar from "./ProgressBar";
import { BiHide } from "react-icons/bi";
import _ from "lodash";
import { VscExpandAll } from "react-icons/vsc";
import useDebounce from "@/hooks/useDebounce";
import { RiListSettingsFill } from "react-icons/ri";
import { MdSettings } from "react-icons/md";
interface Props {
  enabled: boolean;
  setEnabled: Dispatch<SetStateAction<boolean>>;
  evaler: Evaler;
  currentNodeData?: Chess.NodeData;
  moveKey: string;
  currentGame: Chess.Game;
}

import { parsePGN } from "../game/MoveHistory";
import { ClipLoader } from "react-spinners";

const parseScore = (score: Chess.EvalScore): string => {
  if (score.type === "mate") {
    return `M${Math.abs(score.value)}`;
  } else {
    const res = score.value / 100;
    return `${res < 0 ? "" : "+"}${res.toFixed(2)} `;
  }
};

function uciMovesToPgn(line: Chess.Line, game: Chess.Game): string[] {
  const result: string[] = [];
  try {
    let currentGame = _.cloneDeep(game);
    line.moves.forEach((uciMove) => {
      const move = currentGame.legalMoves.find(
        (move) => move.start === uciMove.start && move.end === uciMove.end && move.promotion === uciMove.promotion
      );
      if (!move) {
        return result;
      } else {
        result.push(parsePGN(move.PGN, currentGame.activeColor));
        const nextGame = Chess.move(currentGame, move);
        currentGame = nextGame;
      }
    });
    return result;
  } catch (e) {
    console.error(e);
    return result;
  }
}

export default function EvalInfo({ evaler, enabled, setEnabled, moveKey, currentGame }: Props) {
  const parsedLines = useMemo(() => {
    if (evaler.inProgress || !enabled || !evaler.evaluation) {
      return [];
    }
    const lines = evaler.evaluation.lines.map((line) => ({ ...line, moves: uciMovesToPgn(line, currentGame) }));
    return lines;
  }, [currentGame, enabled, evaler.inProgress, evaler.evaluation]);
  const score = useMemo(() => {
    if (evaler.currentScore) return parseScore(evaler.currentScore);
    else return "+0.0";
  }, [evaler.currentScore]);

  const progress = (evaler.currentDepth / evaler.currentOptions.depth) * 100;
  const [showLines, setShowLines] = useState(true);
  return (
    <div className="w-full">
      <div className="w-full  bg-white/[0.1]">
        <div className="flex flex-row">
          <div className="flex flex-row p-2 pl-4 justify-between items-center grow">
            <div className={`flex flex-col ${enabled ? "" : "opacity-20"}`}>
              <h2 className="text-2xl font-semibold text-left">{score}</h2>
              <p className="text-xs opacity-70">{`Current depth: ${evaler.currentDepth}/${evaler.currentOptions.depth}`}</p>
            </div>
            <Toggle
              checked={enabled}
              onChange={setEnabled}
              label="Stockfish 15"
              labelClasses="text-sm mr-4 opacity-50"
              className="items-center mr-2"
            ></Toggle>
          </div>
          <div className="h-inherit flex flex-col justify-center px-4 bg-white/[0.05]">
            <MdSettings className="text-2xl text-white/[0.5]" />
          </div>
        </div>
      </div>
      <ProgressBar progress={enabled ? progress : 0} key={`${moveKey}${evaler.inProgress ? "a" : "b"}`} />
      {enabled && (
        <>
          <div
            className={`w-full bg-[#202020] flex flex-row justify-end border-b border-r border-white/[0.1]  pb-[4px] pt-[4px]  pr-2 text-white/[0.6]`}
          >
            {showLines ? (
              <button
                onClick={() => {
                  setShowLines(false);
                }}
                className={`text-xs flex flex-row items-center cursor-pointer hover:text-white group`}
              >
                <BiHide className="inline mr-1 mt-[2px]" size={14} />
                <p>Hide Lines</p>
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowLines(true);
                }}
                className="text-xs flex flex-row items-center cursor-pointer hover:text-white group"
              >
                <VscExpandAll className="inline mr-1 mt-[2px] group-hover:text-white" size={14} />
                <p>Show Lines</p>
              </button>
            )}
          </div>
          {showLines && (
            <div className="w-full py-3 px-4 bg-white/[0.05] space-y-2">
              <>
                {evaler.inProgress &&
                  Array.from(Array(evaler.currentOptions.multiPV).keys()).map((_, idx) => {
                    return (
                      <div key={idx} className="flex flex-row items-center h-6 w-full ">
                        <ClipLoader size={16} color="white" />
                      </div>
                    );
                  })}
              </>
              {evaler.evaluation &&
                !evaler.inProgress &&
                parsedLines.map((line, idx) => {
                  return (
                    <div key={idx} className="flex flex-row items-center h-6 w-full ">
                      <div className="w-[50px] shrink-0 rounded-sm bg-white/[0.1] opacity-60 py-1">
                        <p className="text-xs text-center ">{parseScore(line.score)}</p>
                      </div>

                      <p className="truncate mb-[1px] px-2 text-sm">{line.moves.join(" ")}</p>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

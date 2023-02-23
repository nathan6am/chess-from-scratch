import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import * as Chess from "@/lib/chess";
import { Evaler } from "@/hooks/useLocalEval";
import Toggle from "../UI/Toggle";
import ProgressBar from "./ProgressBar";
import { BiHide } from "react-icons/bi";
import _ from "lodash";
import { VscExpandAll } from "react-icons/vsc";
import { MdSettings, MdExpandMore, MdCloud } from "react-icons/md";
import { Popover } from "@headlessui/react";
import { usePopper } from "react-popper";
interface Props {
  enabled: boolean;
  setEnabled: Dispatch<SetStateAction<boolean>>;
  evaler: Evaler;
  currentNodeData?: Chess.NodeData;
  moveKey: string;
  currentGame: Chess.Game;
  attemptMoves: (moves: string[]) => void;
}

import { parsePGN } from "../game/MoveHistory";
import { ClipLoader } from "react-spinners";
import NumbericInput from "../UI/NumbericInput";
import { notEmpty } from "@/util/misc";

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
        result.push(move.PGN);
        const nextGame = Chess.move(currentGame, move);
        currentGame = nextGame;
      }
    });
    return result;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default function EvalInfo({ evaler, enabled, setEnabled, moveKey, currentGame, attemptMoves }: Props) {
  let [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>();
  let [popperElement, setPopperElement] = useState<HTMLDivElement | null>();
  let { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 10],
        },
      },
    ],
  });
  const parsedLines = useMemo(() => {
    if (evaler.inProgress || !enabled || !evaler.evaluation) {
      return [];
    }
    const lines = evaler.evaluation.lines.map((line) => ({
      ...line,
      moves: uciMovesToPgn(line, currentGame),
      moveCount: currentGame.moveHistory.flat().filter(notEmpty).length + 1,
    }));
    return lines;
  }, [enabled, evaler.inProgress, evaler.evaluation]);
  const score = useMemo(() => {
    if (evaler.currentScore) return parseScore(evaler.currentScore);
    else return "+0.0";
  }, [evaler.currentScore]);

  const bestMove = useMemo(() => {
    const uciMove = evaler.bestMove;
    if (!uciMove) return null;
    const move = currentGame.legalMoves.find(
      (move) => move.start === uciMove.start && move.end === uciMove.end && move.promotion === uciMove.promotion
    );
    return move?.PGN || null;
  }, [evaler.bestMove]);

  const progress = (evaler.currentDepth / evaler.currentOptions.depth) * 100;
  const [showLines, setShowLines] = useState(true);
  return (
    <div className="w-full">
      <div className="w-full  bg-white/[0.1]">
        <Popover>
          <div className="flex flex-row">
            <div className="flex flex-row p-2 pl-4 justify-between items-center grow">
              <div className={`flex flex-col ${enabled ? "" : "opacity-20"}`}>
                <h2 className="text-2xl font-semibold text-left">{score}</h2>
                <p className="text-xs opacity-70">
                  {`Current depth: ${evaler.currentDepth}/${evaler.currentOptions.depth}`}
                  {evaler.evaluation?.isCloud && !evaler.inProgress ? (
                    <MdCloud className="opacity-60 inline text-lg ml-1 mb-1" />
                  ) : null}
                </p>
              </div>
              <Toggle
                checked={enabled}
                onChange={setEnabled}
                label="Stockfish 15"
                labelClasses="text-sm mr-4 opacity-50"
                className="items-center mr-2"
              ></Toggle>
            </div>
            <Popover.Button className="h-inherit group">
              <div
                ref={setReferenceElement}
                className="h-full flex flex-col justify-center px-4 bg-white/[0.05] group-hover:bg-white/[0.1]"
              >
                <MdSettings className="text-2xl text-white/[0.5]" />
              </div>
            </Popover.Button>
          </div>

          <Popover.Panel ref={setPopperElement} className="z-50" style={styles.popper} {...attributes.popper}>
            <OptionsMenu evaler={evaler} />
          </Popover.Panel>
        </Popover>
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
              {/* <p>Best move: {`${bestMove || ""}`}</p> */}
              <>
                {evaler.inProgress &&
                  Array.from(Array(evaler.currentOptions.multiPV).keys()).map((_, idx) => {
                    return (
                      <div key={idx} className="flex flex-row items-center h-6 w-full ">
                        <div className="w-[50px] shrink-0 rounded-sm bg-white/[0.1] opacity-60 py-1">
                          <div className="h-[1em] relative w-full">
                            <div className="absolute top-0 left-0 right-0 bottom-0 w-full flex justify-center items-center">
                              <ClipLoader size={14} color="white" />
                            </div>
                          </div>
                        </div>

                        <div className="h-full w-full rounded-sm bg-white/[0.02] ml-4">
                          <div className="h-[1em]"></div>
                        </div>
                      </div>
                    );
                  })}
              </>
              {evaler.evaluation &&
                !evaler.inProgress &&
                parsedLines.map((line, idx) => {
                  return <RenderLine key={idx} line={line} attemptMoves={attemptMoves} currentGame={currentGame} />;
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface LineProps {
  line: {
    moves: string[];
    score: {
      type: "cp" | "mate";
      value: number;
    };
    moveCount: number;
  };
  attemptMoves: (moves: string[]) => void;
  currentGame: Chess.Game;
}
function RenderLine({ line, attemptMoves, currentGame }: LineProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`flex flex-row items-start w-full ${expanded ? "h-fit" : "h-6"}`}>
      <div className="w-[50px] shrink-0 rounded-sm bg-white/[0.1] opacity-60 py-1 h-fit mr-1">
        <p className="text-xs text-center ">{parseScore(line.score)}</p>
      </div>

      <p className={`${expanded ? "" : "truncate"} bg-white/[0.02] px-1 rounded-sm mb-[1px] px-2 text-sm`}>
        {line.moves.map((move, idx) => (
          <RenderMove
            key={idx}
            pgn={move}
            idx={idx}
            moveCount={line.moveCount + idx}
            onClick={() => {
              attemptMoves(line.moves.slice(0, idx + 1));
            }}
          />
        ))}
      </p>
      <button
        className={`pt-1 flex flex-col justify-center
                text-sepia
              `}
        onClick={() => {
          setExpanded((x) => !x);
        }}
      >
        <MdExpandMore className={` transition-transform duration-400 text-xl ${expanded ? "" : "rotate-[-90deg]"}`} />
      </button>
    </div>
  );
}

interface MoveProps {
  pgn: string;
  onClick: any;
  moveCount: number;
  idx: number;
}
function RenderMove({ pgn, onClick, moveCount, idx }: MoveProps) {
  const isWhite = moveCount % 2 !== 0;
  return (
    <>
      {(isWhite || idx === 0) && (
        <span className="inline ml-[6px] opacity-50 text-sm mr-[-2px]">{Chess.moveCountToNotation(moveCount)}</span>
      )}
      <span
        className="inline-block cursor-pointer py-[2px] rounded-md hover:bg-white/[0.1] px-[1px] mr-[1px]"
        onClick={onClick}
      >
        {parsePGN(pgn, isWhite ? "w" : "b")}
      </span>
    </>
  );
}

function OptionsMenu({ evaler }: { evaler: Evaler }) {
  return (
    <div className="w-full p-4 bg-[#363636] rounded-md shadow-lg">
      <Toggle
        className="mb-3"
        label="NNUE"
        labelClasses="text-sm opacity-75"
        checked={evaler.currentOptions.useNNUE}
        onChange={(enabled) => {
          evaler.updateOptions({
            useNNUE: enabled,
          });
        }}
      />
      <Toggle
        className="mb-3"
        label="Cloud Evaluation"
        labelClasses="text-sm opacity-75"
        checked={evaler.currentOptions.useCloud}
        onChange={(enabled) => {
          evaler.updateOptions({
            useCloud: enabled,
          });
        }}
      />
      <NumbericInput
        label="MultiPV"
        value={evaler.currentOptions.multiPV}
        min={1}
        max={5}
        onChange={(val) => {
          evaler.updateOptions({ multiPV: val });
        }}
      />
      <NumbericInput
        label="depth"
        value={evaler.currentOptions.depth}
        min={1}
        max={30}
        onChange={(val) => {
          evaler.updateOptions({ depth: val });
        }}
      />
    </div>
  );
}

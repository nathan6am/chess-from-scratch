import React, { useEffect, useState, useContext, useRef, Fragment } from "react";
import Board from "../game/Board";
import Draggable from "react-draggable";
import { Transition } from "@headlessui/react";
import { SettingsContext } from "@/context/settings";
import useAnalysisBoard from "@/hooks/useAnalysisBoard";
import { ResizableBox } from "react-resizable";
import BoardControls from "../game/BoardControls";
import { FadeLoader, ClipLoader } from "react-spinners";
import { IoMdOpen, IoMdClose, IoMdMore } from "react-icons/io";
import Link from "next/link";
interface Props {
  shown: boolean;
  pgn: string;
  closePlayer: () => void;
  loading: boolean;
  link?: string;
}
import * as Chess from "@/lib/chess";
import useGameViewer from "@/hooks/useGameReplay";
import { replacePieceChars } from "../game/MoveHistory";
import { TreeNode } from "@/lib/types";

export default function PopupPlayer({ pgn, closePlayer, shown, loading, link }: Props) {
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  const replay = useGameViewer({ pgn });
  const { currentGame, boardControls, currentKey, setCurrentKey, currentLine, tagData } = replay;
  const { settings } = useContext(SettingsContext);
  return (
    <Transition
      show={shown}
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 "
      enterTo="opacity-100 "
      leave="ease-in duration-200"
      leaveFrom="opacity-100 "
      leaveTo="opacity-0 "
    >
      <div className="absolute top-20 left-20 shadow-lg z-[50]">
        <Draggable handle=".handle">
          <div className="border border-white/[0.2] bg-[#303030] rounded-sm absolute top-20 left-20 shadow-lg z-[50] overflow-hidden ">
            <div className="flex flex-col w-full relative">
              {/* <div className="absolute top-4 left-4 z-[60] p-4 bg-black/[0.8]">
            {tagData &&
              Object.entries(tagData).map(([name, value]) => {
                return (
                  <div key={name}>
                    <p>{`${name}: ${value}`}</p>
                  </div>
                );
              })}
          </div> */}
              <div className="w-full pl-4 pr-1 py-2 handle flex flex-row justify-between ">
                <div className="grow relative cursor-move">
                  <div className="absolute top-0 bottom-0 left-0 right-0 flex items-center pointer-none">
                    {loading ? (
                      <p className="opacity-70">
                        <span className="inline mr-1">
                          <ClipLoader className="inline" color="white" size={14} />
                        </span>
                        Loading Game
                      </p>
                    ) : (
                      <h4 className="truncate">
                        {tagData?.event || ""} - {tagData?.date || ""}
                      </h4>
                    )}
                  </div>
                </div>
                <div className="flex flex-row items-center w-fit whitespace-nowrap">
                  <button>
                    <IoMdMore className="text-white/[0.8] hover:text-white text-2xl" />
                  </button>
                  <Link
                    className="mr-1 text-xl text-white/[0.8] hover:text-white"
                    href={link || ""}
                    data-tooltip-id="my-tooltip"
                    rel="noopener noreferrer"
                    target="_blank"
                    data-tooltip-content="Open in New Analysis Board"
                  >
                    <IoMdOpen />
                  </Link>
                  <button
                    onClick={closePlayer}
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content="Close Player"
                  >
                    <IoMdClose className=" text-white/[0.8] hover:text-white text-2xl " />
                  </button>
                </div>
              </div>

              <div className="w-full h-8 relative">
                <div className="absolute top-0 bottom-0 left-0 right-0">
                  <MoveTape line={currentLine} currentKey={currentKey} jumpToKey={setCurrentKey} />
                </div>
              </div>

              <div className={`flex ${orientation === "b" ? "flex-col" : "flex-col-reverse"}`}>
                <div className="w-full p-1 px-3 text-xs">
                  <p className="flex flex-row items-center">
                    <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-white mr-1 " />
                    {tagData?.white || "?"}
                    <span className="inline opacity-60 ml-1">{`(${
                      tagData?.eloWhite || "?"
                    })`}</span>
                  </p>
                </div>
                <ResizableBox
                  axis="both"
                  lockAspectRatio={true}
                  width={400}
                  height={400}
                  draggableOpts={{}}
                  minConstraints={[300, 300]}
                  maxConstraints={[900, 900]}
                  className={`${
                    settings.display.showCoordinates === "outside" ? "p-[1.5em]" : ""
                  } bg-[#121212] flex justify-center items-center`}
                  handle={(resizeHandle, ref) => (
                    <div
                      className="w-[20px] h-[20px] react-resizable-handle-se absolute bottom-0 right-0 z-[300]"
                      ref={ref}
                    >
                      <div
                        className="pointer-none h-full"
                        style={{ overflow: "hidden", resize: "both" }}
                      ></div>
                    </div>
                  )}
                >
                  <Board
                    overrideTheme
                    //disableArrows
                    squareIdPrefix="popup-board"
                    showCoordinates={settings.display.showCoordinates}
                    movementType="both"
                    theme={settings.display.boardTheme}
                    pieceSet={settings.display.pieceTheme}
                    orientation={orientation}
                    legalMoves={currentGame.legalMoves}
                    showHighlights={settings.display.showHighlights}
                    showTargets={settings.display.showValidMoves}
                    pieces={currentGame.board}
                    animationSpeed={settings.display.animationSpeed}
                    lastMove={currentGame.lastMove}
                    activeColor={currentGame.activeColor}
                    moveable={"none"}
                    preMoveable={false}
                    autoQueen={settings.gameBehavior.autoQueen}
                    onMove={() => {}}
                    onPremove={() => {}}
                  />
                </ResizableBox>
                <div className="w-full p-1 px-3 text-xs">
                  <p className="flex flex-row items-center">
                    <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-black mr-1" />
                    {tagData?.black || "?"}
                    <span className="inline opacity-60 ml-1">{`(${
                      tagData?.eloBlack || "?"
                    })`}</span>
                  </p>
                </div>
              </div>

              <BoardControls
                controls={boardControls}
                flipBoard={() => {
                  setOrientation((cur) => (cur === "w" ? "b" : "w"));
                }}
              />
            </div>
          </div>
        </Draggable>
      </div>
    </Transition>
  );
}

interface TapeProps {
  line: TreeNode<Chess.NodeData>[];
  currentKey: string | null;
  jumpToKey: (key: string) => void;
  result?: string;
}
function MoveTape({ line, currentKey, jumpToKey, result }: TapeProps) {
  return (
    <>
      <div className="pl-4 h-8 items-center flex flex-row w-full overflow-x-scroll scrollbar scrollbar-thumb-white/[0.2] scrollbar-rounded-sm scrollbar-thin scrollbar-track-[#121212] scrollbar-w-[8px] bg-black/[0.5]">
        {line.map((node, idx) => {
          return (
            <RenderMove
              key={idx}
              active={currentKey === node.key}
              onClick={() => {
                jumpToKey(node.key);
              }}
              pgn={node.data.PGN}
              halfMoveCount={idx + 1}
            />
          );
        })}
        <div className="flex flex-row text-sm mr-2">
          <span className={` ml-[2px] opacity-80 text-white font-bold`}>{result || "1-0"}</span>
        </div>
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !active) return;
    ref.current.scrollIntoView({ behavior: "smooth" });
  }, [active, ref]);
  return (
    <div ref={ref} className="flex flex-row text-xs">
      {isWhite && (
        <span className={` ml-[2px] opacity-50 text-white py-[1px]`}>
          {Chess.moveCountToNotation(halfMoveCount)}
        </span>
      )}
      <span
        className={`cursor-pointer whitespace-nowrap mx-[2px] py-[1px] px-[2px] rounded hover:bg-white/[0.1] text-white/[0.7] ${
          isWhite ? "" : "mr-[6px]"
        } ${active ? "bg-blue-400/[0.2] " : ""}`}
        onClick={onClick}
      >
        {replacePieceChars(pgn, isWhite ? "w" : "b")}
      </span>
    </div>
  );
}

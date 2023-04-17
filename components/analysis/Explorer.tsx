import { ApiResponse, DBGameData, ExplorerHook, MoveData } from "@/hooks/useOpeningExplorer";
import React, { useCallback, useRef, useMemo, useEffect, useState, Fragment } from "react";
import { ScrollContainer } from "../layout/GameLayout";
import Loading from "../UI/Loading";
import { replacePieceChars } from "../game/MoveHistory";
import * as Chess from "@/lib/chess";
import _ from "lodash";

import { Popover, Listbox, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";
import { MdFilterList, MdCheck } from "react-icons/md";
import { FaDatabase } from "react-icons/fa";
import { HiOutlineSelector } from "react-icons/hi";

interface Props {
  explorer: ExplorerHook;
  onMove: (move: Chess.Move) => void;
  showPlayer: () => void;
}
export default function Explorer({ explorer, onMove, showPlayer }: Props) {
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
  const { data, error, isLoading, sourceGame } = explorer;
  const attemptMove = useCallback(
    (san: string) => {
      const move = sourceGame.legalMoves.find((move) => move.PGN === san);
      if (move) onMove(move);
    },
    [onMove, sourceGame]
  );

  const prevOpening = useRef<{ name: string; eco: string } | null>(null);
  useEffect(() => {
    if (!data) return;
    if (data.opening && !_.isEqual(data.opening, prevOpening)) {
      prevOpening.current = data.opening;
    }
  }, [data]);
  const opening = useMemo(() => {
    return data?.opening || prevOpening.current;
  }, [data]);
  return (
    <div className="h-full w-full flex flex-col">
      <div className="w-full h-[400px] flex flex-col">
        <Popover>
          <div className="flex flex-row bg-[#303030]">
            <div className="flex flex-row p-2 pl-4 justify-between items-center grow">
              <DBSelect value={explorer.database} onChange={explorer.setDatabase} />
            </div>
            <Popover.Button className="h-inherit group">
              <div
                ref={setReferenceElement}
                className="h-full flex flex-col justify-center px-2 bg-white/[0.05] group-hover:bg-white/[0.1]"
              >
                <MdFilterList className="text-2xl text-white/[0.5]" />
              </div>
            </Popover.Button>
          </div>

          <Popover.Panel
            ref={setPopperElement}
            className="z-50"
            style={styles.popper}
            {...attributes.popper}
          >
            <FiltersMenu />
          </Popover.Panel>
        </Popover>
        <div className="w-full p-2 px-3 text-md bg-[#202020] shadow-md">
          {`Opening: ${opening?.name || "Starting Position"}`}
          <span className="inline text-sepia/[0.8]">{`${
            opening?.eco ? ` (${opening.eco})` : ""
          }`}</span>
        </div>
        <div className="w-full flex flex-row py-1 pr-2 border-b border-white/[0.2] opacity-60">
          <div className="w-[121px] flex flex-row items-center px-2">
            <div className="text-xs  w-[50px] mr-2 text-center">
              <p>Move</p>
            </div>
            <p className="text-xs ">#Games</p>
          </div>
          <div className="text-xs pl-1">Result: (White | Draw | Black)</div>
        </div>
        <div className="w-full grow relative">
          <ScrollContainer>
            <>
              {(error || (!data && !isLoading)) && <p>Unable to reach database</p>}
              {(isLoading || (!data && !error)) && (
                <>
                  <Loading />
                </>
              )}
              {data && !isLoading && (
                <>
                  {data.moves.map((moveData) => (
                    <RenderMoveRow
                      attemptMove={attemptMove}
                      moveData={moveData}
                      key={moveData.uci}
                    />
                  ))}
                </>
              )}
            </>
          </ScrollContainer>
          <div className="bottom-0 left-0 right-0 absolute h-6 bg-gradient-to-b from-transparent to-[#121212]/[0.5]"></div>
        </div>
      </div>
      <TopGames
        games={data?.topGames || []}
        sourceGame={sourceGame}
        attemptMove={attemptMove}
        loadGame={(id: string) => {
          explorer.fetchOTBGame(id);
          showPlayer();
        }}
      />
    </div>
  );
}

interface MoveRowProps {
  moveData: MoveData;
  attemptMove: (san: string) => void;
}
function RenderMoveRow({ moveData, attemptMove }: MoveRowProps) {
  const notation = replacePieceChars(moveData.san, "w");
  const totalGames = moveData.white + moveData.black + moveData.draws;
  const total = useMemo(() => {
    if (totalGames > 1000000 * 1000)
      return `${(Math.round((totalGames * 10) / 1000000000) / 10).toFixed(1)}B`;
    if (totalGames > 1000000)
      return `${(Math.round((totalGames * 10) / 1000000) / 10).toFixed(1)}M`;
    //else if (totalGames > 1000) return `${Math.round(totalGames/1000)}K`
    else return `${totalGames}`;
  }, [totalGames]);
  return (
    <div className="w-full flex flex-row py-1 pr-2 border-b border-white/[0.2]">
      <div className="w-40 flex flex-row items-center px-2">
        <button
          onClick={() => {
            attemptMove(moveData.san);
          }}
          className="text-sm px-1 py-1 bg-white/[0.1] hover:bg-white/[0.2] rounded-sm w-[50px] mr-2 text-center"
        >
          {notation}
        </button>
        <p className="text-xs ">{total}</p>
      </div>
      <PercentageBar
        total={totalGames}
        black={moveData.black}
        draws={moveData.draws}
        white={moveData.white}
      />
    </div>
  );
}

interface BarProps {
  total: number;
  white: number;
  black: number;
  draws: number;
}
function PercentageBar({ total, white, black, draws }: BarProps) {
  return (
    <div className="w-full flex flex-row overflow-hidden rounded-sm border border-white/[0.1]">
      {white > 0 && (
        <div
          className="bg-white text-black text-xs px-2 flex items-center"
          style={{ flexBasis: `${Math.round((white / total) * 100)}%` }}
        >
          <p>{`${
            Math.round((white / total) * 100) > 1 ? `${Math.round((white / total) * 100)}%` : white
          }`}</p>
        </div>
      )}
      {draws > 0 && (
        <div
          className="bg-[#363636] text-white text-xs px-2 flex items-center"
          style={{ flexBasis: `${Math.round((draws / total) * 100)}%` }}
        >{`${
          Math.round((draws / total) * 100) > 1 ? `${Math.round((draws / total) * 100)}%` : draws
        }`}</div>
      )}
      {black > 0 && (
        <div
          className="bg-black grow text-white text-xs px-2 flex items-center"
          style={{ flexBasis: `${Math.round((black / total) * 100)}%` }}
        >{`${
          Math.round((black / total) * 100) > 1 ? `${Math.round((black / total) * 100)}%` : black
        }`}</div>
      )}
    </div>
  );
}

interface TopGameProps {
  games: DBGameData[];
  sourceGame: Chess.Game;
  attemptMove: (san: string) => void;
  loadGame: (gameid: string) => void;
}
function TopGames({ games, sourceGame, attemptMove, loadGame }: TopGameProps) {
  return (
    <div className="w-full grow overflow-hidden flex flex-col">
      <div className="w-full bg-white/[0.1] py-1 px-3">Top Games</div>
      <div className="w-full grow relative">
        <ScrollContainer>
          {games.map((game) => (
            <RenderGame
              key={game.id}
              game={game}
              sourceGame={sourceGame}
              attemptMove={attemptMove}
              loadGame={loadGame}
            />
          ))}
        </ScrollContainer>
      </div>
    </div>
  );
}

function RenderGame({
  game,
  sourceGame,
  attemptMove,
  loadGame,
}: {
  game: DBGameData;
  sourceGame: Chess.Game;
  attemptMove: (san: string) => void;
  loadGame: (gameid: string) => void;
}) {
  const movePGN = useMemo(() => {
    const uci = game.uci ? Chess.parseUciMove(game.uci) : null;
    if (!uci) return null;
    return (
      sourceGame.legalMoves.find(
        (move) =>
          move.start === uci.start &&
          move.end === uci.end &&
          (move.promotion ? move.promotion === uci.promotion : true)
      )?.PGN || null
    );
  }, [game, sourceGame]);
  return (
    <div className="flex flex-row w-full items-center border-b justify-between px-2 pr-4 hover:bg-white/[0.1]">
      <div
        onClick={() => {
          loadGame(game.id);
        }}
        className="flex flex-row w-fit items-center cursor-pointer"
      >
        <div className="flex flex-col w-[220px] text-xs p-1 ">
          <p className="flex flex-row items-center">
            <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-white mr-1 " />
            {game.white.name}
            <span className="inline opacity-60 ml-1">
              {game.white.rating && `(${game.white.rating})`}
            </span>
          </p>
          <p className="flex flex-row items-center">
            <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-black mr-1" />
            {game.black.name}
            <span className="inline opacity-60 ml-1">
              {game.black.rating && `(${game.black.rating})`}
            </span>
          </p>
        </div>
        <RenderGameResult winner={game.winner} />
      </div>
      <p className="text-sm">{game.month || game.year}</p>
      <button
        onClick={() => {
          if (movePGN) {
            attemptMove(movePGN);
          }
        }}
        className="text-sm px-1 py-1 bg-white/[0.1] hover:bg-white/[0.2] rounded-sm w-[50px] mr-2 text-center"
      >
        {movePGN ? replacePieceChars(movePGN, sourceGame.activeColor) : "-"}
      </button>
    </div>
  );
}

function RenderGameResult({ winner }: { winner: "black" | "white" | null }) {
  const results = {
    white: { classes: "bg-white text-black", text: "1 - 0" },
    draw: { classes: "bg-[#363636] text-white", text: "½ - ½" },
    black: { classes: "bg-black text-white", text: "0 - 1" },
  };
  return (
    <div className={`py-1 px-2 rounded-md h-fit w-16  ${results[winner || "draw"].classes}`}>
      <p className="text-center text-sm">{results[winner || "draw"].text}</p>
    </div>
  );
}

function FiltersMenu() {
  return <div className="w-full p-4 bg-[#363636] rounded-md shadow-lg">Filters</div>;
}

function DBSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: "lichess" | "masters") => void;
}) {
  const options = [
    { value: "lichess", label: "Lichess" },
    { value: "masters", label: "Masters" },
  ];
  return (
    <div className="w-40">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-[#181818] overflow-hidden text-left focus:outline-none flex flex-row pr-10 items-center">
            <div className="h-full p-2 flex justify-center items-center bg-[#242424]">
              <FaDatabase className="text-white" />
            </div>

            <span className="block truncate text-white/[0.8] mx-2">
              {options.find((option) => option.value === value)?.label}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <HiOutlineSelector />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="z-[20] absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#242424] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    `relative cursor-default select-none py-1 pl-8 pr-4 ${
                      active ? "bg-white/[0.1] text-white/[0.8]" : "text-white/[0.6]"
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${selected ? "text-white" : "text-white/[0.6]"}`}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sepia">
                          <MdCheck />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

import React, { useCallback, useRef, useMemo, useEffect, useState, Fragment } from "react";

//Types
import { DBGameData, ExplorerHook, MoveData } from "@/hooks/useOpeningExplorer";

//Components
import { ScrollContainer } from "@/components/layout/GameLayout";
import { Label } from "@/components/base/Typography";
import { RangeSlider, Loading, MultiSelect, NumericInput, Input } from "@/components/base/";
import { replacePieceChars } from "../game/MoveHistory";
import { Popover, Listbox, Transition } from "@headlessui/react";

//Icons
import { MdFilterList, MdCheck } from "react-icons/md";
import { FaDatabase } from "react-icons/fa";
import { HiOutlineSelector } from "react-icons/hi";
import { IoIosPodium } from "react-icons/io";
import { RxCounterClockwiseClock } from "react-icons/rx";

//Util
import { usePopper } from "react-popper";
import * as Chess from "@/lib/chess";
import _ from "lodash";

interface Props {
  explorer: ExplorerHook;
  onMove: (move: Chess.Move) => void;
  showPlayer: () => void;
}
export default function Explorer({ explorer, onMove, showPlayer }: Props) {
  const { data, error, isLoading, sourceGame } = explorer;
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

  const attemptMove = useCallback(
    (san: string) => {
      const move = sourceGame.legalMoves.find((move) => move.PGN === san);
      if (move) onMove(move);
    },
    [onMove, sourceGame]
  );
  const startPositionOpening = useMemo(() => {
    if (sourceGame.config.startPosition === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
      return "Start Position";
    else return "Custom Position";
  }, [sourceGame.config.startPosition]);
  const prevOpening = useRef<{ name: string; eco: string } | null>({
    name: startPositionOpening,
    eco: "",
  });
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
    <>
      <div className="w-full grow max-height-[500px] min-height-[250px] flex flex-col">
        <Popover>
          <div className="flex flex-row bg-elevation-3">
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

          <Popover.Panel ref={setPopperElement} className="z-50" style={styles.popper} {...attributes.popper}>
            {explorer.database === "lichess" ? (
              <LichessFilters explorer={explorer} />
            ) : (
              <MastersFilters explorer={explorer} />
            )}
          </Popover.Panel>
        </Popover>
        <div className="w-full p-2 px-3 text-sm bg-elevation-2 shadow-md">
          {
            <p className="text-light-200">
              <span className="text-gold-100">{`Opening: `}</span>
              {`${opening?.name || ""}`}
              <span className="inline text-light-300">{`${opening?.eco ? ` (${opening.eco})` : ""}`}</span>
            </p>
          }
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
        <div className="w-full grow min-h-[10em] md:min-h-0 relative">
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
                    <RenderMoveRow attemptMove={attemptMove} moveData={moveData} key={moveData.uci} />
                  ))}
                </>
              )}
            </>
          </ScrollContainer>
          <div className="bottom-0 left-0 right-0 absolute h-6 bg-gradient-to-b from-transparent to-[#121212]/[0.5] pointer-events-none"></div>
        </div>
      </div>
      <TopGames
        database={explorer.database}
        isLoading={isLoading}
        topGames={data?.topGames || []}
        recentGames={data?.recentGames || []}
        sourceGame={sourceGame}
        attemptMove={attemptMove}
        loadGame={(id: string) => {
          explorer.fetchOTBGame(id);
          showPlayer();
        }}
      />
    </>
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
    if (totalGames > 1000000 * 1000) return `${(Math.round((totalGames * 10) / 1000000000) / 10).toFixed(1)}B`;
    if (totalGames > 1000000) return `${(Math.round((totalGames * 10) / 1000000) / 10).toFixed(1)}M`;
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
      <PercentageBar total={totalGames} black={moveData.black} draws={moveData.draws} white={moveData.white} />
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
          <p>{`${Math.round((white / total) * 100) > 1 ? `${Math.round((white / total) * 100)}%` : white}`}</p>
        </div>
      )}
      {draws > 0 && (
        <div
          className="bg-[#363636] text-white text-xs px-2 flex items-center"
          style={{ flexBasis: `${Math.round((draws / total) * 100)}%` }}
        >{`${Math.round((draws / total) * 100) > 1 ? `${Math.round((draws / total) * 100)}%` : draws}`}</div>
      )}
      {black > 0 && (
        <div
          className="bg-black grow text-white text-xs px-2 flex items-center"
          style={{ flexBasis: `${Math.round((black / total) * 100)}%` }}
        >{`${Math.round((black / total) * 100) > 1 ? `${Math.round((black / total) * 100)}%` : black}`}</div>
      )}
    </div>
  );
}

interface TopGameProps {
  database: "lichess" | "masters";
  topGames: DBGameData[];
  recentGames: DBGameData[];
  sourceGame: Chess.Game;
  attemptMove: (san: string) => void;
  loadGame: (gameid: string) => void;
  isLoading?: boolean;
}
function TopGames({ topGames, recentGames, sourceGame, attemptMove, loadGame, isLoading, database }: TopGameProps) {
  const [gameList, setGameList] = useState<"top" | "recent">("recent");
  useEffect(() => {
    if (database === "masters") setGameList("top");
  }, [database]);
  const games = useMemo(() => (gameList === "top" ? topGames : recentGames), [gameList, topGames, recentGames]);
  return (
    <div className="w-full grow overflow-hidden flex flex-col min-h-[250px]">
      <div className="w-full text-sm bg-elevation-2 text-gold-100 py-1 px-3 shadow flex flex-row justify-start">
        <button
          onClick={() => setGameList("top")}
          className={classNames("rounded-md px-2 py-0.5 mr-1 border", {
            "bg-gold-100/[0.1] border-gold-100 text-gold-100": gameList === "top",
            "text-light-300 border-transparent hover:text-light-100": gameList !== "top",
          })}
        >
          <IoIosPodium className="mr-0.5 inline" />
          Top Games
        </button>
        <button
          disabled={database === "masters"}
          onClick={() => setGameList("recent")}
          className={classNames("rounded-md px-2 py-0.5 mr-3 border", {
            "bg-gold-100/[0.1] border-gold-100 text-gold-100": gameList === "recent",
            "text-light-300 border-transparent hover:text-light-100": gameList !== "recent" && database === "lichess",
            "text-light-400/[0.5] border-transparent": database === "masters",
          })}
        >
          <RxCounterClockwiseClock className="mr-1 mb-0.5 inline" />
          Recent Games
        </button>
      </div>
      <div className="w-full grow relative">
        <ScrollContainer>
          {isLoading ? (
            <></>
          ) : games.length > 0 ? (
            games.map((game) => (
              <RenderGame
                key={game.id}
                game={game}
                sourceGame={sourceGame}
                attemptMove={attemptMove}
                loadGame={loadGame}
              />
            ))
          ) : (
            <p className="text-light-300 text-xs py-2 px-4">
              <em>No games found.</em>
            </p>
          )}
        </ScrollContainer>
        <div className="bottom-0 left-0 right-0 absolute h-6 bg-gradient-to-b from-transparent to-[#121212]/[0.5] pointer-events-none"></div>
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
          move.start === uci.start && move.end === uci.end && (move.promotion ? move.promotion === uci.promotion : true)
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
            <span className="inline opacity-60 ml-1">{game.white.rating && `(${game.white.rating})`}</span>
          </p>
          <p className="flex flex-row items-center">
            <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-black mr-1" />
            {game.black.name}
            <span className="inline opacity-60 ml-1">{game.black.rating && `(${game.black.rating})`}</span>
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
  const [speeds, setSpeeds] = useState<string[]>([]);
  const options = [
    { value: "bullet", label: "Bullet" },
    { value: "blitz", label: "Blitz" },
    { value: "rapid", label: "Rapid" },
    { value: "classical", label: "Classical" },
  ];

  return <div className="w-[24rem] p-4 bg-elevation-3 rounded-md shadow-lg"></div>;
}

function DBSelect({ value, onChange }: { value: string; onChange: (value: "lichess" | "masters") => void }) {
  const options = [
    { value: "lichess", label: "Lichess" },
    { value: "masters", label: "Masters" },
  ];
  return (
    <div className="w-40">
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-elevation-1 overflow-hidden text-left focus:outline-none flex flex-row pr-10 shadow items-center">
            <div
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Database source"
              data-tooltip-place="bottom"
              className="h-full p-2 flex justify-center items-center bg-elevation-2"
            >
              <FaDatabase className="text-gold-200" />
            </div>

            <span className="block truncate text-light-200 mx-2">
              {options.find((option) => option.value === value)?.label}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <HiOutlineSelector />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
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
                      <span className={`block truncate ${selected ? "text-white" : "text-white/[0.6]"}`}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gold-200">
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

type RatingIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
const ratingMap = {
  0: {
    value: 0,
    label: "0",
  },
  1: {
    value: 1000,
    label: "1000",
  },
  2: {
    value: 1200,
    label: "1200",
  },
  3: {
    value: 1400,
    label: "1400",
  },
  4: {
    value: 1600,
    label: "1600",
  },
  5: {
    value: 1800,
    label: "1800",
  },
  6: {
    value: 2000,
    label: "2000",
  },
  7: {
    value: 2200,
    label: "2200",
  },
  8: {
    value: 2500,
    label: "2500+",
  },
};

import type { Speed } from "@/hooks/useOpeningExplorer";
import classNames from "classnames";
function LichessFilters({ explorer }: { explorer: ExplorerHook }) {
  const { lichessFilters, setLichessFilters } = explorer;
  const { speeds, ratings } = lichessFilters;
  const speedOptions = [
    { value: "ultraBullet", label: "UltraBullet" },
    { value: "bullet", label: "Bullet" },
    { value: "blitz", label: "Blitz" },
    { value: "rapid", label: "Rapid" },
    { value: "classical", label: "Classical" },
    { value: "correspondence", label: "Correspondence" },
  ];
  const setSpeeds = (speeds: Speed[]) => {
    setLichessFilters({ ...lichessFilters, speeds });
  };
  const ratingsValue = useMemo<[RatingIndex, RatingIndex]>(() => {
    const [min, max] = ratings;
    const minIndex = Object.values(ratingMap).findIndex((rating) => rating.value === min);
    const maxIndex = Object.values(ratingMap).findIndex((rating) => rating.value === max);
    return [minIndex, maxIndex] as [RatingIndex, RatingIndex];
  }, [ratings]);
  const [minLabel, maxLabel] = useMemo(() => {
    const [min, max] = ratingsValue;
    return [ratingMap[min].label, ratingMap[max].label];
  }, [ratingsValue]);
  const setRatings = ([_min, _max]: [number, number]) => {
    const min = _min as RatingIndex;
    const max = _max as RatingIndex;
    const minRating = ratingMap[min].value as (typeof lichessFilters.ratings)[0];
    const maxRating = ratingMap[max].value as (typeof lichessFilters.ratings)[1];
    setLichessFilters({ ...lichessFilters, ratings: [minRating, maxRating] });
  };
  return (
    <div className="w-[24rem] p-4 bg-elevation-2 border-elevation-5 border rounded-md shadow-lg">
      <div className="w-full ">
        <Label className="mb-1">Time Controls</Label>
        <MultiSelect
          buttonClassName="bg-elevation-4 hover:bg-elevation-5"
          optionsClassName="bg-elevation-4 "
          options={speedOptions}
          value={speeds}
          onChange={setSpeeds}
          showSelectAll
        />
        <Label className="mt-4">Rating</Label>
      </div>
      <div className="w-full mt-[-0.5em] pr-2">
        <RangeSlider
          min={0}
          max={8}
          step={1}
          value={ratingsValue}
          onChange={setRatings}
          minLabel={minLabel}
          maxLabel={maxLabel}
          allowOverlap="atMax"
        />
      </div>
      <div className="w-full mt-4  flex flex-row justify-between gap-x-4">
        <NumericInput
          label="Top Games"
          value={lichessFilters.topGames}
          onChange={(topGames) => setLichessFilters({ ...lichessFilters, topGames })}
          min={0}
          max={4}
        />
        <NumericInput
          label="Moves"
          value={lichessFilters.moves}
          onChange={(moves) => setLichessFilters({ ...lichessFilters, moves })}
          min={0}
          max={20}
        />
      </div>
      <div className="w-full mt-4  flex flex-row justify-between gap-x-4">
        <Input type="date" label="From" />
        <Input type="date" label="To" />
      </div>
    </div>
  );
}

function MastersFilters({ explorer }: { explorer: ExplorerHook }) {
  const { mastersFilters, setMastersFilters } = explorer;

  return (
    <div className="w-[24rem] p-4 bg-elevation-3 rounded-md shadow-lg">
      <div className="w-full mt-4  flex flex-row justify-between gap-x-4">
        <NumericInput
          label="Top Games"
          value={mastersFilters.topGames}
          onChange={(topGames) => setMastersFilters({ ...mastersFilters, topGames })}
          min={0}
          max={15}
        />
        <NumericInput
          label="Moves"
          value={mastersFilters.moves}
          onChange={(moves) => setMastersFilters({ ...mastersFilters, moves })}
          min={0}
          max={20}
        />
      </div>
      <div className="w-full mt-4  flex flex-row justify-between gap-x-4">
        <Input type="date" label="From" />
        <Input type="date" label="To" />
      </div>
    </div>
  );
}

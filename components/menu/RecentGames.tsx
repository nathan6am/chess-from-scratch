import React, { useMemo } from "react";
import useGameSearch from "@/hooks/useGameSearch";
import { ScrollContainer } from "../layout/GameLayout";
import User_Game from "@/lib/db/entities/User_Game";
import * as Chess from "@/lib/chess";
import { ImMinus } from "react-icons/im";
import { MdArrowDropUp, MdArrowDropDown, MdTimer } from "react-icons/md";
import { FaArchive, FaChevronRight } from "react-icons/fa";
import { IoMdMore } from "react-icons/io";
import GameList from "./GameList";
import useAuth from "@/hooks/useAuth";
export default function RecentGames() {
  const { user } = useAuth();
  const { games: usergames } = useGameSearch({});
  return (
    <div className="flex flex-col w-full h-full items-center min-h-[20rem] bg-elevation-2 shadow-lg rounded-lg">
      <div className="p-3 w-full px-6 flex flex-row justify-between">
        <h2 className="text-gold-200 font-bold text-xl  text-left shadow-lg">Recent Games</h2>

        <button className="flex flex-row items-center gap-x-1 text-sm text-light-300 hover:text-gold-100">
          <FaArchive className="text-md mt-0.5 mr-1" />
          Game Archive
          <FaChevronRight className="text-xs mt-[3px]" />
        </button>
      </div>

      {user?.type === "guest" ? (
        <div className="w-full h-full grow relative">
          <p
            className="italic text-sm text-light-400 m-4 w-full text-center
        "
          >
            Make an account to save your games and access them from any device.
          </p>
        </div>
      ) : (
        <GameList usergames={usergames} />
      )}
    </div>
  );
}

interface Player {
  username: string | null;
  rating?: number;
  id?: string;
  isComputer?: boolean;
}

function RenderGame({ game: userGame }: { game: User_Game }) {
  const playerColor = userGame.color;
  const { game, result } = userGame;
  const { date } = game;
  const formattedDate = useMemo(() => {
    const d = new Date(date);
    return d.toLocaleDateString();
  }, [date]);
  const formattedTimeControl = useMemo(() => {
    const { timeControl } = game;
    return `${timeControl.timeSeconds / 60}+${timeControl?.incrementSeconds || 0}`;
  }, [game]);
  const moves = useMemo(() => {
    return game.data.moveHistory.length;
  }, [game]);
  const players = useMemo<Record<Chess.Color, Player>>(() => {
    const w = game.players.find((p) => p.color === "w");
    const b = game.players.find((p) => p.color === "b");
    return {
      w: {
        username: w?.user?.username || (game.guestPlayer?.color === "w" ? "Guest User" : null),
        rating: w?.rating,
        id: w?.user?.id,
      },
      b: {
        username: b?.user?.username || (game.guestPlayer?.color === "b" ? "Guest User" : null),
        rating: b?.rating,
        id: b?.user?.id,
      },
    };
  }, [game]);
  return (
    <tr className="hover:bg-elevation-3 text-sm text-light-100 border-b border-light-400">
      <td className="w-[1rem] hover:text-gold-100 cursor-pointer">
        <IoMdMore className="text-lg ml-2" />
      </td>
      <td>
        <div className="flex flex-col w-[180px] text-xs p-1 pl-0 ">
          <p className="flex flex-row items-center">
            <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-white mr-1 " />
            {players.w.username || (
              <span className="opacity-50">
                <em>Account Deleted</em>
              </span>
            )}
            <span className="inline opacity-60 ml-1">{players.w.rating && `(${players.w.rating})`}</span>
          </p>
          <p className="flex flex-row items-center">
            <span className="mt-[2px] inline-block h-[0.8em] w-[0.8em] border border-white/[0.3] rounded-sm bg-black mr-1" />
            {players.b.username || (
              <span className="opacity-50">
                <em>Account Deleted</em>
              </span>
            )}
            <span className="inline opacity-60 ml-1">{players.b.rating && `(${players.b.rating})`}</span>
          </p>
        </div>
      </td>
      <td>
        <ResultIcon result={result} />
      </td>
      <td>{formattedDate}</td>
      <td className="pl-1">
        {formattedTimeControl}
        <span className="inline"></span>
      </td>
      <td className="pl-1">{moves}</td>
    </tr>
  );
}

function ResultIcon({ result }: { result: "win" | "loss" | "draw" }) {
  switch (result) {
    case "win":
      return <MdArrowDropUp className="text-green-400 text-3xl" />;
    case "loss":
      return <MdArrowDropDown className="text-red-400 text-3xl" />;
    case "draw":
      return <ImMinus className="text-light-300 text-sm" />;
  }
}

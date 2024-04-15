import React from "react";

//components
import { FaArchive, FaChevronRight } from "react-icons/fa";
import GameList from "../GameList";
import Link from "next/link";

//hooks
import useAuth from "@/hooks/useAuth";
import useGameSearch from "@/hooks/useGameSearch";
import { PanelHeader } from "@/components/base/Typography";

export default function RecentGames() {
  const { user } = useAuth();
  const { games: usergames } = useGameSearch({});
  return (
    <div className=" min-h-[30em] px-0 h-full overflow-hidden">
      <div className="p-3 w-full px-6 flex flex-row justify-between">
        <PanelHeader className="text-left">Recent Games</PanelHeader>
        <button className="flex flex-row items-center gap-x-1 text-sm text-light-300 hover:text-gold-100">
          <FaArchive className="text-md mt-0.5 mr-1" />
          Game Archive
          <FaChevronRight className="text-xs mt-[3px]" />
        </button>
      </div>

      {user?.type === "guest" ? (
        <div className="w-full h-full grow relative">
          <p
            className="italic text-sm text-light-400 m-4 my-8 w-full text-center
        "
          >
            <Link href="/login" className="underline hover:text-light-300">
              Login
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="underline hover:text-light-300">
              make an account
            </Link>{" "}
            to view your game history.
          </p>
        </div>
      ) : (
        <GameList usergames={usergames} />
      )}
    </div>
  );
}

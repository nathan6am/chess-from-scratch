import React, { useCallback, useContext, useEffect, useState } from "react";
import { SocketContext } from "@/context/socket";
import { useRouter } from "next/router";
import GameSearch from "@/components/menu/GameSearch";
import useProfile from "@/hooks/useProfile";
import useGameSearch from "@/hooks/useGameSearch";
import RecentGames from "@/components/menu/RecentGames";
import { LobbyOptions } from "@/server/types/lobby";
import NewGameMenu from "@/components/menu/NewGame";
export default function Play() {
  const router = useRouter();
  const socket = useContext(SocketContext);

  const createLobby = useCallback(
    (options: Partial<LobbyOptions>) => {
      console.log(options);
      socket.emit("lobby:create", options, (response) => {
        if (response && response.data) {
          router.push(`/play/${response.data.id}`);
        }
      });
    },
    [socket, router]
  );
  const [joinInput, setJoinInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { user, error, isValidating } = useProfile();
  const { games } = useGameSearch({});
  return (
    <>
      <div className="w-full h-full flex flex-col p-6 md:px-10 lg:px-16 bg-elevation-1 items-center ">
        <div className="w-full h-full flex flex-col xl:flex-row gap-x-4">


          <div className="w-[26rem] h-fit shrink-0 mb-4">
            <NewGameMenu />
          </div>
          <div className="grow w-full flex flex-col items-center justify-center h-full justify-start gap-y-4">
            <RecentGames />
          </div>
        </div>
      </div>
    </>
  );
}

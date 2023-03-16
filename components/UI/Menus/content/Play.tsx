import React, { useCallback, useContext, useEffect, useState } from "react";
import { SocketContext } from "@/context/socket";
import { useRouter } from "next/router";
import Button from "../../Button";
import NewGame from "../../dialogs/NewGame";
import useProfile from "@/hooks/useProfile";
import { gameFromNodeData } from "@/lib/chess";
import { LobbyOptions } from "@/server/types/lobby";
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
  return (
    <>
      <div className="flex flex-col items-center w-full p-6 md:p-10">
        <NewGame
          isOpen={showModal}
          closeModal={() => {
            setShowModal(false);
          }}
          onCreateLobby={createLobby}
        />
        <div className="col-span-2 w-full max-w-[1000px] my-6 flex flex-row ">
          <h1 className="font-bold text-3xl text-left p-2 border-sepia border-b-4">New Game</h1>
        </div>
        <div className="max-w-[1000px] w-full md:p-10 p-6 grid md:grid-cols-2 gap-4 gap-8 bg-[#202020] rounded-lg shadow-lg">
          <Button
            onClick={() => {
              setShowModal(true);
            }}
          >
            <p>Play with a Friend</p>
          </Button>
          <Button>
            <p>Play vs. Computer</p>
          </Button>
          <Button>
            <p>Play Local</p>
          </Button>
          <Button>
            <p>Random Opponent</p>
          </Button>
        </div>
      </div>
      <div className="w-full flex flex-col p-6 md:p-10 bg-[#181818] items-center">
        <div className="w-full grid lg:grid-cols-2 gap-8 max-w-[1000px]">
          <div className="bg-[#222222] flex flex-col min-h-[300px] rounded-lg shadow-lg">
            <div className="w-full p-2 px-6 shadow-md">
              <h3 className="w-fit text-lg">Recent Games</h3>
            </div>
            <div className="grow w-full relative">
              <div className="top-0 bottom-0 left-0 right-0 absolute bg-black/[0.1] overflow-y-scroll">
                {user?.games &&
                  user.games.map((usergame) => {
                    const opponent =
                      usergame.game.players.find((player) => player.user.id !== user.id)?.user ||
                      usergame.game.guestPlayer;
                    const color = usergame.color;
                    const outcome = usergame.game.data.outcome;
                    const result =
                      outcome?.result === "d" ? "Draw" : outcome?.result === color ? "Win" : "Loss";
                    return (
                      <p key={usergame.game.id}>
                        {result} vs. {opponent?.username || ""}
                      </p>
                    );
                  })}
                {(!user || !user.games?.length) && (
                  <div className="px-8 p-4 text-sm text-center italic text-white/[0.5]">
                    No games to show.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-[#222222] flex flex-col min-h-[300px] rounded-lg shadow-lg">
            <div className="w-full p-2 px-6 shadow-md">
              <h3 className="w-fit text-lg">Active Games</h3>
            </div>
            <div className="grow w-full relative">
              <div className="top-0 bottom-0 left-0 right-0 absolute bg-black/[0.1] overflow-y-scroll">
                <div className="px-8 p-4 text-sm text-center italic text-white/[0.5]">
                  No games to show.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

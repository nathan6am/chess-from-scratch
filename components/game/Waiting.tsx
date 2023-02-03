import React, { Fragment, useState } from "react";
import { SyncLoader, BeatLoader } from "react-spinners";
import { Transition } from "@headlessui/react";
import { useRouter } from "next/router";
interface Props {
  lobbyUrl: string;
}
export default function Waiting({ lobbyUrl }: Props) {
  const router = useRouter();
  return (
    <div className="container flex justify-center items-center">
      <div className="w-2xl py-10 px-10 lg:px-20 flex flex-col items-center justify-center rounded-lg bg-[#1f1f1f] shadow-lg">
        <h2 className="w-full my-4 text-xl flex flex-row items-baseline">
          Waiting for opponent to join{" "}
          <BeatLoader className="inline ml-1" size={6} color="white" />
        </h2>
        <LobbyLink lobbyUrl={lobbyUrl} />
        <button
          onClick={() => {
            router.push("/play");
          }}
          className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 mt-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function LobbyLink({ lobbyUrl }: Props) {
  const [fade, setFade] = useState(true);
  return (
    <div className="w-full p-6 my-4 bg-white/[0.05] rounded-md">
      <p className="text-sm opacity-50">
        Share this link to invite a friend to join the game
      </p>
      <div className="flex flex-row rounded-md my-4 min-w-[400px]  overflow-hidden">
        <div className="px-4 py-2 pr-8 bg-[#121212] rounded-l-md border-white/[0.5] border-y-2 border-l-2 grow">
          {lobbyUrl}
        </div>
        <button
          onClick={(e) => {
            navigator.clipboard.writeText(lobbyUrl);
          }}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 w-fit z-10 border-blue-800 relative"
        >
          Copy Link
        </button>
      </div>
      <p className="text-sm opacity-50">
        The first player to user this link will be your opponent
      </p>
    </div>
  );
}

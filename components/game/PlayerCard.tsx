import React from "react";
import { Player } from "@/server/types/lobby";
interface Props {
  player: Player;
  connectionStatus: boolean;
}
export default function PlayerCard({ player, connectionStatus }: Props) {
  return (
    <div className=" w-full md:w-80 bg-white/[0.1] p-2 px-4 flex flex-row items-center text-white/[0.7] text-sm relative h-10">
      <div className="absolute top-0 bottom-0 right-0 h-full aspect-square bg-white/[0.1] border-l border-white flex justify-center items-center">
        {player.score.toFixed(1)}
      </div>
      <div
        className={`rounded-full w-3 h-3 ${
          connectionStatus ? "bg-green-500" : "bg-white/[0.1]"
        } mt-1 mr-2`}
      ></div>
      {`${player.username} (${player.rating || "?"})`}
    </div>
  );
}

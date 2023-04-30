import React from "react";
import { FaHandshake } from "react-icons/fa";
import { GameControls as IGameControls } from "@/hooks/useChessOnline";
import { FiRepeat, FiFlag } from "react-icons/fi";

interface Props {
  gameControls: IGameControls;
  flipBoard: () => void;
  className?: string;
  size: "sm" | "lg";
}
export default function GameControls({ gameControls, flipBoard, className, size }: Props) {
  return (
    <div className={`flex flex-row justify-around px-4 ${className ? className : ""}`}>
      <button className="p-4 text-white/[0.7] hover:text-white  grow w-full" onClick={flipBoard}>
        <FiRepeat className={`mx-auto ${size === "lg" ? "text-xl" : ""}`} />
      </button>
      <button
        onClick={gameControls.resign}
        className="p-4 text-white/[0.7] hover:text-red-500 grow w-full"
      >
        <FiFlag className={`mx-auto ${size === "lg" ? "text-xl" : ""}`} />
      </button>
      <button className="p-4 text-white/[0.7] hover:text-white  grow w-full">
        <FaHandshake className={`mx-auto ${size === "lg" ? "text-xl" : ""}`} />
      </button>
    </div>
  );
}

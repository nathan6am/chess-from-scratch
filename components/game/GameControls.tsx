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
    <div className="flex flex-row justify-between w-full">
      <button
        onClick={gameControls.offerDraw}
        className="bg-elevation-2 hover:bg-elevation-3 w-full py-2 text-light-200 hover:text-gold-100"
      >
        Offer Draw <FaHandshake className={`inline`} />
      </button>
      <button
        onClick={gameControls.resign}
        className="bg-elevation-2 hover:bg-elevation-3 w-full py-2 text-light-200 hover:text-gold-100"
      >
        Resign <FiFlag className={`inline`} />
      </button>
    </div>
  );
}

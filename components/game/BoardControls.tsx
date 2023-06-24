import React from "react";

import {
  AiOutlineStepForward,
  AiOutlineFastForward,
  AiOutlineStepBackward,
  AiOutlineFastBackward,
} from "react-icons/ai";
import { FiRepeat, FiFlag } from "react-icons/fi";
interface Props {
  controls: {
    stepForward: () => void;
    stepBackward: () => void;
    jumpForward: () => void;
    jumpBackward: () => void;
    jumpToOffset?: (offset: number) => void;
  };
  className?: string;
  flipBoard?: () => void;
}
export default function BoardControls({ controls, className, flipBoard }: Props) {
  return (
    <div className={`flex flex-row justify-around bg-elevation-1 shadow-lg ${className || ""}`}>
      <button
        onClick={controls.jumpBackward}
        className="p-3 text-light-300 hover:text-gold-200 hover:bg-elevation-2 grow w-full"
      >
        <AiOutlineFastBackward className="text-2xl mx-auto" />
      </button>
      <button
        onClick={controls.stepBackward}
        className="p-3 text-light-300 hover:text-gold-200 hover:bg-elevation-2 grow w-full"
      >
        <AiOutlineStepBackward className="text-xl mx-auto" />
      </button>
      <button
        onClick={controls.stepForward}
        className="p-3 text-light-300 hover:text-gold-200 hover:bg-elevation-2 grow w-full"
      >
        <AiOutlineStepForward className="text-xl mx-auto" />
      </button>
      <button
        onClick={controls.jumpForward}
        className="p-3 text-light-300 hover:text-gold-200 hover:bg-elevation-2 grow w-full"
      >
        <AiOutlineFastForward className="text-2xl mx-auto" />
      </button>
      {flipBoard !== undefined && (
        <button
          // data-tooltip-content="Flip Board"
          // data-tooltip-position="bottom"
          // data-tooltip-id="my-tooltip"
          // data-tooltip-delay-show={500}
          onClick={flipBoard}
          className="p-3 text-light-300 hover:text-gold-200 hover:bg-elevation-2 grow w-full"
        >
          <FiRepeat className="text-2xl mx-auto" />
        </button>
      )}
    </div>
  );
}

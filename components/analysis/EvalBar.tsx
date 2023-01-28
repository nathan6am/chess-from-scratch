import React, { useMemo } from "react";
import * as Chess from "@/lib/chess";
interface Props {
  orientation: Chess.Color;
  scoreType: "cp" | "mate";
  value: number;
  scale: number;
}
import useThrottledValue from "@/hooks/useThrottledValue";
export default function EvalBar({
  orientation,
  scoreType,
  value,
  scale,
}: Props) {
  //Throttle value for smoother animation/fewer jumps
  const throttledValue = useThrottledValue({ value, throttleMs: 300 });

  //Calculated scaled percentage for eval bar
  const percentage = useMemo(() => {
    if (scoreType === "mate") return throttledValue < 0 ? 100 : 0;
    const evaluation = throttledValue / 100;
    const scaled = 50 - evaluation * scale;
    if (scaled > 5 && scaled < 95) return scaled;
    return evaluation < 0 ? 95 : 5;
  }, [scoreType, throttledValue, scale]);

  const label = useMemo(() => {
    if (scoreType === "mate") {
      return `M${Math.abs(throttledValue)}`;
    } else {
      const score = throttledValue / 100;
      return `${score < 0 ? "" : "+"}${score.toFixed(1)} `;
    }
  }, [throttledValue, scoreType]);
  return (
    <div className="h-full w-[60px] rounded-sm overflow-hidden relative mx-2">
      <div className="left-0 w-full top-[50%] border-t border-red-600 z-10 opacity-50 border-2 absolute" />
      {orientation === "w" ? (
        <span
          className={`z-10 w-full absolute text-center left-0 text-xs py-2 ${
            throttledValue < 0 ? "top-0 text-white" : "bottom-0 text-black"
          }`}
        >
          {label}
        </span>
      ) : (
        <span
          className={`z-10 w-full absolute text-center left-0 text-xs py-2 ${
            !(throttledValue < 0) ? "top-1 text-black" : "bottom-1 text-white"
          }`}
        >
          {label}
        </span>
      )}
      <div className="h-full w-full absolute top-0 left-0 bottom-0 right-0 bg-[#1f1f1f] z-2"></div>
      <div
        className={`h-full w-full bottom-0 left-0 absolute z-3 bg-white`}
        style={{
          transform:
            orientation === "w"
              ? `translate3d(0px, ${percentage}%, 0px)`
              : `translate3d(0px, -${percentage}%, 0px)`,
          transition: `transform 1s ease-in`,
        }}
      ></div>
    </div>
  );
}

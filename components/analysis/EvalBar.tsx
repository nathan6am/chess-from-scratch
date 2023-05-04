import React, { useEffect, useMemo } from "react";
import * as Chess from "@/lib/chess";
import useThrottle from "@/hooks/useThrottle";
interface Props {
  orientation: Chess.Color;
  scoreType: "cp" | "mate";
  value: number;
  scale: number;
}

export default function EvalBar({ orientation, scoreType, value, scale }: Props) {
  //Throttle value for smoother animation/fewer jumps
  const throttledValue = useThrottle(value, 600);
  useEffect(() => {
    console.log("throttledValue", throttledValue);
  }, [throttledValue]);

  //Calculated scaled percentage for eval bar
  const percentage = useMemo(() => {
    if (scoreType === "mate") return throttledValue < 0 ? 100 : 0;
    const evaluation = throttledValue / 100;
    const scaled = 50 - evaluation * scale;
    if (scaled > 5 && scaled < 95) return scaled;
    return evaluation < 0 ? 95 : 5;
  }, [scoreType, throttledValue, scale]);

  const throttledPercentage = useThrottle(percentage, 600);

  const label = useMemo(() => {
    if (scoreType === "mate") {
      return `M${Math.abs(throttledValue)}`;
    } else {
      const score = throttledValue / 100;
      return `${score < 0 ? "" : "+"}${score.toFixed(1)} `;
    }
  }, [throttledValue, scoreType]);

  const barRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!barRef.current) return;
        barRef.current.style.transform =
          orientation === "w"
            ? `translate3d(0px, ${throttledPercentage}%, 0px)`
            : `translate3d(0px, -${throttledPercentage}%, 0px)`;
      });
    });
  }, [throttledPercentage, orientation, barRef]);
  return (
    <div className="h-inherit w-[50px] rounded-sm overflow-hidden relative mx-4 mr-10">
      <div className="h-inherit absolute top-0 bottom-0 left-0 right-0">
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
        <div className="h-full w-full absolute top-0 left-0 bottom-0 right-0 bg-[#2f2f2f] z-2"></div>
        <div
          ref={barRef}
          className={`h-full w-full bottom-0 left-0 top-0 right-0 absolute z-3 bg-white`}
          style={{
            WebkitTransition: `-webkit-transform .6s ease`,
            transition: `transform 1s ease`,
            MozTransition: `-moz-transform .6s ease`,
            transform: `translate3d(0px, 50}%, 0px)`,
          }}
        ></div>
      </div>
    </div>
  );
}

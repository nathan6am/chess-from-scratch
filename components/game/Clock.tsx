import * as Chess from "@/lib/chess";
import { time } from "console";
import { set } from "lodash";
import { DurationObjectUnits } from "luxon";
import { useEffect, useState } from "react";
import { LuClock12 } from "react-icons/lu";
import cn from "@/util/cn";
interface ClockProps {
  color: Chess.Color;
  timeRemaining: DurationObjectUnits;
  size: "sm" | "lg";
  className?: string;
  showLowTime?: boolean;
  lowTimeThreshold?: number;
}
const zeroPad = (num: number, places: number) => String(num).padStart(places, "0");

const classes = {
  sm: "h-10 text-lg px-8",
  lg: "py-3 rounded text-2xl px-8",
};

export default function Clock({ color, timeRemaining, size, className }: ClockProps) {
  // const [clockPosition, setClockPosition] = useState<0 | 1 | 2 | 3>(0);
  // useEffect(() => {
  //   setClockPosition((current) => {
  //     if (current === 3) return 0;
  //     return (current + 1) as 0 | 1 | 2 | 3;
  //   });
  // }, [timeRemaining.seconds]);
  return (
    <div
      className={`${classes[size]} w-24 flex justify-center items-center md:rounded-lg relative ${
        color === "w" ? "bg-light-200 text-black/[0.7] " : "bg-elevation-2 text-white  "
      } ${className || ""}`}
    >
      {/* <span className="absolute top-0 bottom-0 left-0 pl-1">
        <LuClock12
          className={cn({
            "rotate-90": clockPosition === 1,
            "rotate-180": clockPosition === 2,
            "rotate-[-90]": clockPosition === 3,
          })}
        />
      </span> */}
      <h3 className="my-auto mx-auto">
        {`${timeRemaining.hours || 0 > 0 ? timeRemaining.hours + ":" : ""}${
          timeRemaining.hours || 0 > 0 ? zeroPad(timeRemaining.minutes || 0, 2) : timeRemaining.minutes
        }:${zeroPad(timeRemaining.seconds || 0, 2)}`}
      </h3>
    </div>
  );
}

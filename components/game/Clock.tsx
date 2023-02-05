import * as Chess from "@/lib/chess";
import { DurationObjectUnits } from "luxon";

interface ClockProps {
  color: Chess.Color;
  timeRemaining: DurationObjectUnits;
}
const zeroPad = (num: number, places: number) =>
  String(num).padStart(places, "0");

export default function Clock({ color, timeRemaining }: ClockProps) {
  return (
    <div
      className={`h-10 text-xl px-8 w-fit flex justify-center items-center ${
        color === "w" ? "bg-[#919191] text-black/[0.7]" : "bg-black text-white"
      }`}
    >
      <h3 className="my-auto mx-auto">
        {`${timeRemaining.hours || 0 > 0 ? timeRemaining.hours + ":" : ""}${
          timeRemaining.hours || 0 > 0
            ? zeroPad(timeRemaining.minutes || 0, 2)
            : timeRemaining.minutes
        }:${zeroPad(timeRemaining.seconds || 0, 2)}`}
      </h3>
    </div>
  );
}

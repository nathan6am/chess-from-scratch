import * as Chess from "@/lib/chess";
import { DurationObjectUnits } from "luxon";

interface ClockProps {
  color: Chess.Color;
  timeRemaining: DurationObjectUnits;
}
const zeroPad = (num: number, places: number) => String(num).padStart(places, "0");

export default function CountdownClock({ color, timeRemaining }: ClockProps) {
  return (
    <h3
      className={`py-4 rounded text-3xl px-10 w-fit ${
        color === "w" ? "bg-[#919191] text-black/[0.7]" : "bg-black text-white"
      }`}
    >
      {`${timeRemaining.hours || 0 > 0 ? timeRemaining.hours + ":" : ""}${
        timeRemaining.hours || 0 > 0 ? zeroPad(timeRemaining.minutes || 0, 2) : timeRemaining.minutes
      }:${zeroPad(timeRemaining.seconds || 0, 2)}`}
    </h3>
  );
}

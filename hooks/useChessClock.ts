import { useState } from "react";
import useTimer from "./utils/useTimer";
import { DurationObjectUnits } from "luxon";
import type { TimeControl } from "@/lib/chess";
import * as Chess from "@/lib/chess";
interface Options {
  timeControl: TimeControl;
  onTimeExpired?: (color: Chess.Color) => void;
  startColor?: Chess.Color;
}

interface ChessClock {
  running: boolean; // is the clock running?
  timeRemainingMs: Record<Chess.Color, number>; // time remaining for each color in milliseconds
  timeRemaining: Record<Chess.Color, DurationObjectUnits>; // time remaining for each color in luxon duration object units
  press: (color?: Chess.Color) => void; // Press the clock for the given color - pause if the color is not active, switch if it is
  start: () => void; // start the clock
  pause: () => void; // pause the clock
  reset: () => void; // reset the clock
  activeColor: Chess.Color; // the color whose clock is currently running
  expired: Chess.Color | null; // the color whose clock has expired
}
export default function useChessClock({ timeControl, onTimeExpired, startColor = "w" }: Options): ChessClock {
  const [running, setRunning] = useState(false);
  const [expired, setExpired] = useState<Chess.Color | null>(null);
  const [activeColor, setActiveColor] = useState<Chess.Color>(startColor);
  const onTimeExpiredWrapper = (color: Chess.Color) => {
    setRunning(false);
    setExpired(color);
    if (onTimeExpired) onTimeExpired(color);
  };
  const wTimer = useTimer(timeControl.timeSeconds * 1000, {
    autoStart: false,
    onTimeExpired: () => onTimeExpiredWrapper("w"),
  });
  const bTimer = useTimer(timeControl.timeSeconds * 1000, {
    autoStart: false,
    onTimeExpired: () => onTimeExpiredWrapper("b"),
  });
  const switchClock = () => {
    if (activeColor === "w") {
      setActiveColor("b");
      wTimer.pause();
      wTimer.addTime(timeControl.incrementSeconds * 1000);
      bTimer.start();
    } else {
      setActiveColor("w");
      bTimer.pause();
      bTimer.addTime(timeControl.incrementSeconds * 1000);
      wTimer.start();
    }
  };
  const pause = () => {
    setRunning(false);
    wTimer.pause();
    bTimer.pause();
  };
  const start = () => {
    setRunning(true);
    if (activeColor === "w") {
      wTimer.start();
    } else {
      bTimer.start();
    }
  };
  const reset = () => {
    setRunning(false);
    setExpired(null);
    wTimer.restart(timeControl.timeSeconds * 1000, false);
    bTimer.restart(timeControl.timeSeconds * 1000, false);
    setActiveColor(startColor);
  };
  const press = (color?: Chess.Color) => {
    if (color && color !== activeColor) pause();
    else switchClock();
  };

  return {
    running,
    timeRemainingMs: {
      w: wTimer.timeRemainingRaw,
      b: bTimer.timeRemainingRaw,
    },
    timeRemaining: {
      w: wTimer.timeRemaining,
      b: bTimer.timeRemaining,
    },
    press,
    start,
    pause,
    reset,
    expired,
    activeColor,
  };
}

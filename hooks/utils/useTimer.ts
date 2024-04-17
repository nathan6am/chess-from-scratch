import { useState, useEffect, useMemo, useCallback } from "react";
import { DateTime, Duration } from "luxon";
import useInterval from "./useInterval";

interface Options {
  autoStart: boolean; // Whether the timer should start automatically
  resolution: "s" | "ds" | "cs" | "ms"; // Precision of the timer
  onTimeExpired?: () => void; // Callback to run when the timer expires
}

const defaultOptions: Options = {
  autoStart: false,
  resolution: "cs",
};

export function useTimer(initialRemainingMs: number, initialOptions?: Partial<Options>) {
  const [options, setOptions] = useState<Options>(() => ({
    ...defaultOptions,
    ...initialOptions,
  }));
  const [endTime, setEndTime] = useState<DateTime>(() => DateTime.now().plus(initialRemainingMs));
  const [running, setRunning] = useState<boolean>(options.autoStart);
  const [timeRemainingRaw, setTimeRemainingRaw] = useState<number>(initialRemainingMs);
  const delay = useMemo(() => {
    if (!running) return null;
    switch (options.resolution) {
      case "s":
        return 1000;
      case "ds":
        return 100;
      case "cs":
        return 10;
      case "ms":
        return 1;
      default:
        return null;
    }
  }, [options.resolution, running]);

  const addTime = (ms: number) => {
    setEndTime((endTime) => endTime.plus(ms));
  };

  useInterval(() => {
    if (running) {
      const remaining = endTime.diffNow().toMillis();
      setTimeRemainingRaw(remaining > 0 ? remaining : 0);
    }
  }, delay);

  useEffect(() => {
    if (timeRemainingRaw === 0 && options.onTimeExpired) {
      options.onTimeExpired();
    }
  }, [timeRemainingRaw, options.onTimeExpired]);
  const start = () => {
    setEndTime(DateTime.now().plus(timeRemainingRaw));
    setRunning(true);
  };
  const pause = () => {
    setRunning(false);
  };
  const restart = useCallback((newTimeRemaining: number, autoStart: boolean = true) => {
    setRunning(false);
    const newEndTime = DateTime.now().plus(newTimeRemaining);
    setEndTime(newEndTime);
    setTimeout(() => {
      setTimeRemainingRaw(newTimeRemaining > 0 ? newTimeRemaining : 0);
    }, 10);
    setOptions((options) => ({ ...options, autoStart: autoStart }));

    if (autoStart) setRunning(true);
  }, []);
  const timeRemaining = useMemo(
    () => Duration.fromMillis(timeRemainingRaw).shiftTo("hours", "minutes", "seconds", "milliseconds").toObject(),
    [timeRemainingRaw]
  );
  return {
    timeRemainingRaw,
    timeRemaining,
    addTime,
    start,
    pause,
    restart,
  };
}

export default useTimer;

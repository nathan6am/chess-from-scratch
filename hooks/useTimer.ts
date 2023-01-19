import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DateTime, Duration } from "luxon";
function useInterval(callback: (...args: any[]) => void, delay: number | null) {
  const callbackRef = useRef<(...args: any[]) => void>();

  // Remember the latest callback.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (callbackRef.current) {
        callbackRef.current();
      }
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

interface Options {
  autoStart: boolean;
  resolution: "s" | "ds" | "cs" | "ms";
}
const defaultOptions: Options = {
  autoStart: true,
  resolution: "s",
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

  useInterval(() => {
    if (running) {
      const remaining = endTime.diffNow().toMillis();
      setTimeRemainingRaw(remaining > 0 ? remaining : 0);
    }
  }, delay);

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
    start,
    pause,
    restart,
  };
}

export default useTimer;

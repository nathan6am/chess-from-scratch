import { useRef, useEffect } from "react";

/**
 * Hook to run a callback on an interval
 * @param callback The callback to run
 * @param delay The interval duration
 */
export default function useInterval(callback: (...args: any[]) => void, delay: number | null) {
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

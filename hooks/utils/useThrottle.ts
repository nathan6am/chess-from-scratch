import { useEffect, useRef, useState } from "react";

/**
 * Hook to throttle the update of a value to a certain limit
 * @param value The value to throttle
 * @param limit How frequently to update the throttled value (in milliseconds)
 * @returns The throttled value
 */

function useThrottle<T>(value: T, limit: number) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(function () {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

export default useThrottle;

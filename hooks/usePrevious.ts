import { useEffect, useRef } from "react";
import isEqual from "lodash/isEqual";

function usePrevious<T>(value: T, isEqualFn: (a: T, b: T) => boolean = isEqual): T | undefined {
  const prevValueRef = useRef<T>();

  useEffect(() => {
    if (prevValueRef.current === undefined) {
      prevValueRef.current = value;
    } else if (!isEqualFn(value, prevValueRef.current)) {
      prevValueRef.current = value;
    }
  }, [value, isEqualFn]);

  return prevValueRef.current;
}

export default usePrevious;

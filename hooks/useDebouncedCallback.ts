import { useCallback, useEffect, useRef } from "react";

type DebouncedCallback<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

type DebouncedResult<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  dependencies: React.DependencyList
): DebouncedResult<T> {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resultRef = useRef<ReturnType<T> | null>(null);

  const debouncedCallback = useCallback<DebouncedCallback<T>>((...args) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      const result = callback(...args);
      resultRef.current = result;
      timerRef.current = null;
    }, delay);
  }, dependencies);

  const debouncedResult = useCallback<DebouncedResult<T>>((...args) => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    const result = callback(...args);
    resultRef.current = result;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
    }, delay);
    return resultRef.current as ReturnType<T>;
  }, dependencies);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedResult;
}
export default useDebouncedCallback;

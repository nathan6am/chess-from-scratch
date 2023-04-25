"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function useDebouncedCallback(callback, delay, dependencies) {
    const timerRef = (0, react_1.useRef)(null);
    const resultRef = (0, react_1.useRef)(null);
    const debouncedCallback = (0, react_1.useCallback)((...args) => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            const result = callback(...args);
            resultRef.current = result;
            timerRef.current = null;
        }, delay);
    }, dependencies);
    const debouncedResult = (0, react_1.useCallback)((...args) => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
        }
        const result = callback(...args);
        resultRef.current = result;
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
        }, delay);
        return resultRef.current;
    }, dependencies);
    (0, react_1.useEffect)(() => {
        return () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);
    return debouncedResult;
}
exports.default = useDebouncedCallback;

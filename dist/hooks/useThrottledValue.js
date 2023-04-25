"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const DEFAULT_THROTTLE_MS = 3000;
const getRemainingTime = (lastTriggeredTime, throttleMs) => {
    const elapsedTime = Date.now() - lastTriggeredTime;
    const remainingTime = throttleMs - elapsedTime;
    return remainingTime < 0 ? 0 : remainingTime;
};
const useThrottledValue = ({ value, throttleMs = DEFAULT_THROTTLE_MS }) => {
    const [throttledValue, setThrottledValue] = (0, react_1.useState)(value);
    const lastTriggered = (0, react_1.useRef)(Date.now());
    const timeoutRef = (0, react_1.useRef)(null);
    const cancel = (0, react_1.useCallback)(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);
    (0, react_1.useEffect)(() => {
        let remainingTime = getRemainingTime(lastTriggered.current, throttleMs);
        if (remainingTime === 0) {
            lastTriggered.current = Date.now();
            setThrottledValue(value);
            cancel();
        }
        else if (!timeoutRef.current) {
            timeoutRef.current = setTimeout(() => {
                remainingTime = getRemainingTime(lastTriggered.current, throttleMs);
                if (remainingTime === 0) {
                    lastTriggered.current = Date.now();
                    setThrottledValue(value);
                    cancel();
                }
            }, remainingTime);
        }
        return cancel;
    }, [cancel, throttleMs, value]);
    return throttledValue;
};
exports.default = useThrottledValue;

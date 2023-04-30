"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const useDebounce_1 = __importDefault(require("./useDebounce"));
function useEvaler(fen) {
    const debouncedFen = (0, useDebounce_1.default)(fen, 500);
    const [evalScore, setEvalScore] = (0, react_1.useState)({ value: 0, type: "cp" });
    const [currentDepth, setCurrentDepth] = (0, react_1.useState)(0);
    const [lines, setLines] = (0, react_1.useState)([]);
    const [options, setOptions] = (0, react_1.useState)({
        useCloudEval: false,
        depth: 20,
        useNNUE: false,
        multiPV: 1,
        showLinesAfterDepth: 0,
    });
    const workerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        workerRef.current = new Worker(new URL("../lib/stockfish/evalWorker.ts", import.meta.url));
        return () => {
            workerRef.current?.terminate();
        };
    }, []);
    (0, react_1.useEffect)(() => {
        const handler = (e) => {
            const message = e.data;
            if (message.type === "updateScore") {
                if (!message.score || !message.depth)
                    return;
                setEvalScore(message.score);
                setCurrentDepth(message.depth);
            }
            if (message.type === "updateLine") {
                if (!message.line || message.index === undefined)
                    return;
                setLines((prev) => {
                    const newLines = [...prev];
                    newLines[message.index || 0] = message.line?.moves || [];
                    return newLines;
                });
            }
        };
        workerRef.current?.addEventListener("message", handler);
        return () => {
            workerRef.current?.removeEventListener("message", handler);
        };
    }, [workerRef]);
    (0, react_1.useEffect)(() => {
        workerRef.current?.postMessage({ type: "evaluateFen", fen: debouncedFen });
    }, [debouncedFen]);
    return {
        currentScore: evalScore,
        currentDepth,
        lines,
        isEvaluating: false,
        options,
        updateOptions: (options) => {
            setOptions((prev) => ({ ...prev, ...options }));
        },
    };
}
exports.default = useEvaler;

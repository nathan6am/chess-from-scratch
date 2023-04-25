"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const commands = __importStar(require("@/lib/chess/UciCmds"));
const lodash_1 = __importDefault(require("lodash"));
const stockfishUtils_1 = require("@/lib/chess/stockfishUtils");
const axios_1 = __importDefault(require("axios"));
//Converts a variation to a line object with score
function pvToLine(pv) {
    if (pv.cp === undefined && pv.mate === undefined)
        throw new Error("Invalid pv object");
    if (!(pv.cp || pv.cp === 0) && !(pv.mate || pv.mate === 0))
        throw new Error("Invalid pv object");
    const score = pv.cp || pv.cp === 0 ? { type: "cp", value: pv.cp } : { type: "mate", value: pv.mate || 0 };
    const moves = pv.moves.split(" ").map((move) => commands.parseUciMove(move));
    return {
        score,
        moves,
    };
}
function normalizeFen(fen) {
    //remove fullMoveNumber and halfMoveClock
    const fenParts = fen.split(" ");
    return fenParts.slice(0, 4).join(" ");
}
//Converts a cloud eval to a local eval
function convertCloudEval(cloudEval, activeColor, fen) {
    if (!cloudEval.pvs.length)
        throw new Error("No lines");
    const lines = cloudEval.pvs.map((pv) => pvToLine(pv));
    lines.sort((lineA, lineB) => {
        const scoreA = lineA.score;
        const scoreB = lineB.score;
        if (scoreA.type === "mate" && scoreB.type === "mate") {
            if (activeColor === "w")
                return scoreA.value - scoreB.value;
            return scoreB.value - scoreA.value;
        }
        else if (scoreA.type === "mate" || scoreB.type === "mate") {
            if (scoreA.type === "mate" && scoreA.value < 0)
                return activeColor === "w" ? 1 : -1;
            if (scoreA.type === "mate" && scoreA.value >= 0)
                return activeColor === "w" ? -1 : 1;
            if (scoreA.type === "cp" && scoreB.value < 0)
                return activeColor === "w" ? -1 : 1;
            return activeColor === "w" ? 1 : -1;
        }
        else {
            if (activeColor === "w")
                return scoreB.value - scoreA.value;
            return scoreA.value - scoreB.value;
        }
    });
    const move = commands.parseUciMove(cloudEval.pvs[0].moves[0]);
    const score = lines[0].score;
    return {
        fen,
        lines,
        depth: cloudEval.depth,
        isCloudEval: true,
        move,
        score,
    };
}
function useEvaler(fen, disabled) {
    const wasmSupported = typeof WebAssembly === "object" &&
        WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
    const stockfishRef = react_1.default.useRef();
    const [isReady, setIsReady] = (0, react_1.useState)(false);
    const cancelled = (0, react_1.useRef)(false);
    const abortedRef = (0, react_1.useRef)(false);
    const [options, setOptions] = (0, react_1.useState)({
        useCloudEval: true,
        depth: 18,
        useNNUE: true,
        multiPV: 3,
        showLinesAfterDepth: 10,
        showEvalBar: true,
    });
    const updateOptions = (newOptions) => {
        setOptions((prevOptions) => (Object.assign(Object.assign({}, prevOptions), newOptions)));
    };
    const [error, setError] = (0, react_1.useState)(null);
    const [isEvaluating, setIsEvaluating] = (0, react_1.useState)(false);
    const [currentDepth, setCurrentDepth] = (0, react_1.useState)(0);
    const [currentScore, setCurrentScore] = (0, react_1.useState)({ type: "cp", value: 0 });
    const [currentMove, setCurrentMove] = (0, react_1.useState)(null);
    const [currentLines, setCurrentLines] = (0, react_1.useState)([]);
    const [isCloudEval, setIsCloudEval] = (0, react_1.useState)(false);
    const evalCache = (0, react_1.useMemo)(() => new Map(), []);
    const evalComplete = (0, react_1.useRef)(false);
    const fenEvaluating = (0, react_1.useRef)(null);
    const evaluation = (0, react_1.useMemo)(() => {
        if (evalComplete.current && fen === fenEvaluating.current && currentMove) {
            return {
                fen,
                depth: currentDepth,
                score: currentScore,
                move: currentMove,
                lines: currentLines,
                isCloudEval,
            };
        }
        else
            return null;
    }, [
        currentDepth,
        currentLines,
        currentMove,
        currentScore,
        evalComplete,
        fen,
        fenEvaluating,
        isCloudEval,
    ]);
    //cache evals
    (0, react_1.useEffect)(() => {
        if (evaluation) {
            evalCache.set(normalizeFen(evaluation.fen), evaluation);
        }
    }, [evaluation, evalCache]);
    //intialize stockfish
    (0, react_1.useEffect)(() => {
        stockfishRef.current = new Worker(wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js");
        // return () => {
        //   stockfishRef.current?.terminate();
        // };
    }, []);
    //Verify engine is ready
    (0, react_1.useEffect)(() => {
        if (cancelled.current === true)
            return;
        if (isReady)
            return;
        if (!window.Worker || !stockfishRef.current)
            return;
        const stockfish = stockfishRef.current;
        const initalize = () => __awaiter(this, void 0, void 0, function* () {
            const status = yield commands.ready(stockfish);
            return status;
        });
        initalize().then((ready) => {
            if (ready) {
                setIsReady(true);
            }
            else {
                setIsReady(false);
            }
        });
        return () => {
            cancelled.current = true;
        };
    }, []);
    //Handle messages from stockfish
    const onMessage = (0, react_1.useCallback)((e) => {
        const data = e.data;
        //console.log(e.data);
        const args = data.split(" ");
        //Return if the current fen is not the same as the one being evaluated
        if (fenEvaluating.current !== fen)
            return;
        if (args[0] === "info" && !(args.includes("string") || args.includes("currmove"))) {
            abortedRef.current = false;
            const info = (0, stockfishUtils_1.parseInfoMessage)(data);
            if (info.score.type !== "cp" && info.score.type !== "mate")
                return;
            if (info.multiPV === 1) {
                setCurrentMove(info.pv[0]);
                setCurrentDepth(info.depth);
                setCurrentScore(info.score);
            }
            if (info.depth >= 10) {
                const line = {
                    score: info.score,
                    moves: info.pv,
                };
                setCurrentLines((lines) => {
                    const newLines = [...lines];
                    newLines[info.multiPV - 1] = line;
                    return newLines;
                });
            }
        }
        if (data.startsWith("bestmove")) {
            if (abortedRef.current) {
                abortedRef.current = false;
                return;
            }
            if (fenEvaluating.current !== fen)
                return;
            setIsEvaluating(false);
            evalComplete.current = true;
            setCurrentMove((0, stockfishUtils_1.parseUciMove)(data.split(" ")[1]));
        }
    }, [abortedRef, isReady, isEvaluating, fen, fenEvaluating]);
    const abort = (0, react_1.useCallback)(() => {
        evalComplete.current = false;
        abortedRef.current = true;
        setIsEvaluating(false);
        const stockfish = stockfishRef.current;
        if (stockfish) {
            stockfish.postMessage("stop");
        }
    }, [abortedRef, stockfishRef, evalComplete]);
    const startEval = (0, react_1.useCallback)((fen) => {
        const stockfish = stockfishRef.current;
        if (!stockfish)
            return;
        stockfish.postMessage("setoption name MultiPV value " + options.multiPV);
        stockfish.postMessage("setoption name UCI_AnalyseMode value true");
        stockfish.postMessage("setoption name Use NNUE value " + options.useNNUE);
        stockfish.postMessage("position fen " + fen);
        stockfish.postMessage("go depth " + options.depth);
    }, [stockfishRef, isReady, options]);
    (0, react_1.useEffect)(() => {
        if (disabled && isEvaluating) {
            abort();
        }
    }, [disabled, isEvaluating]);
    const evaluate = (0, react_1.useCallback)((fen) => __awaiter(this, void 0, void 0, function* () {
        //Stop any current active evaluations
        abort();
        setCurrentLines([]);
        fenEvaluating.current = fen;
        const fetchCloudEval = (fen, multiPv) => __awaiter(this, void 0, void 0, function* () {
            try {
                const res = yield axios_1.default.get("https://lichess.org/api/cloud-eval", {
                    params: {
                        fen,
                        multiPv: multiPv,
                    },
                });
                if (res.status === 200 && res.data) {
                    const activeColor = fen.split(" ")[1];
                    const cloudEval = res.data;
                    const evaluation = convertCloudEval(cloudEval, activeColor, fen);
                    return evaluation;
                }
                return null;
            }
            catch (e) {
                return null;
            }
        });
        const normalizedFen = normalizeFen(fen);
        const cachedEval = evalCache.get(normalizedFen);
        if (!isReady)
            return;
        if (cachedEval) {
            if (cachedEval.depth >= options.depth &&
                cachedEval.lines.length >= options.multiPV &&
                !(options.useCloudEval === false && cachedEval.isCloudEval)) {
                setCurrentDepth(cachedEval.depth);
                setCurrentLines(cachedEval.lines);
                setCurrentMove(cachedEval.move);
                setCurrentScore(cachedEval.score);
                evalComplete.current = true;
                return;
            }
        }
        if (options.useCloudEval) {
            const cloudEval = yield fetchCloudEval(fen, options.multiPV);
            if (cloudEval) {
                evalCache.set(normalizedFen, cloudEval);
                setCurrentDepth(cloudEval.depth);
                setCurrentLines(cloudEval.lines);
                setCurrentMove(cloudEval.move);
                setCurrentScore(cloudEval.score);
                setIsCloudEval(true);
                evalComplete.current = true;
                return;
            }
        }
        setCurrentDepth(0);
        setCurrentMove(null);
        setIsCloudEval(false);
        startEval(fen);
    }), [abort, isReady, options, startEval, evalCache]);
    //Register message handler
    (0, react_1.useEffect)(() => {
        if (!stockfishRef.current)
            return;
        const stockfish = stockfishRef.current;
        stockfish.addEventListener("message", onMessage);
        return () => {
            stockfish.removeEventListener("message", onMessage);
        };
    }, [onMessage]);
    const lastOptions = (0, react_1.useRef)(options);
    const lastFen = (0, react_1.useRef)();
    //evaluate on fen or options change
    (0, react_1.useEffect)(() => {
        console.log(isReady);
        if (!isReady)
            return;
        if (disabled)
            return;
        if (lastFen.current === fen) {
            lastOptions.current = options;
            if (lodash_1.default.isEqual(lastOptions.current, options))
                return;
            if (lastOptions.current.depth > options.depth)
                return;
            if (lastOptions.current.multiPV > options.multiPV)
                return;
            evaluate(fen);
        }
        else {
            console.log("here2");
            lastFen.current = fen;
            evaluate(fen);
        }
    }, [isReady, fen, options, evaluate, disabled]);
    return {
        isReady,
        isEvaluating,
        currentDepth,
        currentMove,
        currentLines,
        currentScore,
        evaluation,
        options,
        updateOptions,
        fenEvaluating: fenEvaluating.current || null,
    };
}
exports.default = useEvaler;

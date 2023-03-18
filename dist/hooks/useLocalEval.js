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
const react_1 = require("react");
const commands = __importStar(require("@/lib/chess/UciCmds"));
const axios_1 = __importDefault(require("axios"));
const defaultOptions = {
    useCloud: true,
    multiPV: 3,
    useNNUE: true,
    depth: 18,
    showEvalBar: true,
};
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
function convertCloudEval(cloudEval, activeColor) {
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
    const bestMove = commands.parseUciMove(cloudEval.pvs[0].moves[0]);
    const score = lines[0].score;
    return {
        bestMove,
        lines,
        depth: cloudEval.depth,
        isCloud: true,
        time: 0,
        score,
    };
}
function useLocalEval(initialOptions) {
    const [options, setOptions] = (0, react_1.useState)(Object.assign(Object.assign({}, initialOptions), defaultOptions));
    const [error, setError] = (0, react_1.useState)(null);
    const [inProgress, setInProgress] = (0, react_1.useState)(false);
    const [currentScore, setCurrentScore] = (0, react_1.useState)(null);
    const [currentDepth, setCurrentDepth] = (0, react_1.useState)(0);
    const [bestMove, setBestMove] = (0, react_1.useState)(null);
    const [evaluation, setEvaluation] = (0, react_1.useState)(null);
    const [finished, setFinished] = (0, react_1.useState)(false);
    const lastFen = (0, react_1.useRef)();
    const wasmSupported = typeof WebAssembly === "object" &&
        WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
    //Intialize worker
    const updateOptions = (updates) => {
        setOptions((current) => (Object.assign(Object.assign({}, current), updates)));
    };
    const stockfishRef = (0, react_1.useRef)();
    const [isReady, setIsReady] = (0, react_1.useState)(false);
    const cancelled = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        stockfishRef.current = new Worker(wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js");
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
                setError(new Error());
            }
        });
        return () => {
            cancelled.current = true;
        };
    }, []);
    //Restart on error
    (0, react_1.useEffect)(() => {
        var _a;
        if (error) {
            (_a = stockfishRef.current) === null || _a === void 0 ? void 0 : _a.terminate();
            stockfishRef.current = new Worker(wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js");
            const stockfish = stockfishRef.current;
            setError(null);
            const initalize = () => __awaiter(this, void 0, void 0, function* () {
                const status = yield commands.ready(stockfish);
                return status;
            });
            initalize().then((ready) => {
                if (ready) {
                    setIsReady(true);
                }
                else {
                    setError(new Error());
                }
            });
        }
    }, [error, stockfishRef]);
    (0, react_1.useEffect)(() => {
        if (lastFen.current)
            getEvaluation(lastFen.current);
    }, [options]);
    const getEvaluation = (fen, cachedEval) => __awaiter(this, void 0, void 0, function* () {
        if (!isReady || !stockfishRef.current) {
            setError(new Error("Eval engine not yet initialized"));
            return;
        }
        else {
            lastFen.current = fen;
            const evaler = stockfishRef.current;
            if (inProgress) {
                yield stop();
            }
            if (cachedEval && cachedEval.depth >= options.depth && cachedEval.lines.length >= options.multiPV) {
                setEvaluation(cachedEval);
                setCurrentDepth(cachedEval.depth);
                setCurrentScore(cachedEval.score);
                return;
            }
            else if (options.useCloud) {
                try {
                    const res = yield axios_1.default.get("https://lichess.org/api/cloud-eval", {
                        params: {
                            fen,
                            multiPv: options.multiPV,
                        },
                    });
                    if (res.status === 200 && res.data) {
                        const activeColor = fen.split(" ")[1];
                        const cloudEval = res.data;
                        const evaluation = convertCloudEval(cloudEval, activeColor);
                        setEvaluation(evaluation);
                        setCurrentDepth(evaluation.depth);
                        setCurrentScore(evaluation.score);
                        setBestMove(evaluation.bestMove);
                        return;
                    }
                }
                catch (e) { }
            }
            setCurrentDepth(0);
            //Callback runs with every depth, with the partial evalutaion for that depth passed as an argument
            //before promise resolves with final evalutaion
            const cb = (partialEval) => {
                setCurrentDepth(partialEval.depth);
                setCurrentScore(partialEval.score);
                if (partialEval.bestMove) {
                    setBestMove(partialEval.bestMove);
                }
            };
            setInProgress(true);
            setFinished(false);
            try {
                console.log("getting eval");
                console.log(fen);
                const result = yield commands.getEvaluation(evaler, Object.assign({ fen: fen }, options), cb);
                setEvaluation(result);
                setCurrentDepth(result.depth);
                setBestMove(result.bestMove);
                setInProgress(false);
                setFinished(true);
                return result;
            }
            catch (e) {
                console.log(e);
                setInProgress(false);
            }
        }
    });
    const stop = () => __awaiter(this, void 0, void 0, function* () {
        const evaler = stockfishRef.current;
        if (!evaler)
            return;
        if (inProgress) {
            try {
                yield commands.stop(evaler);
                setInProgress(false);
            }
            catch (e) {
                setIsReady(false);
                if (e instanceof Error) {
                    setError(e);
                }
                else {
                    setError(new Error());
                }
            }
        }
    });
    return {
        currentOptions: options,
        updateOptions,
        isReady,
        evaluation,
        getEvaluation,
        currentDepth,
        currentScore,
        error,
        inProgress,
        finished,
        bestMove,
        wasmSupported,
        stop,
    };
}
exports.default = useLocalEval;

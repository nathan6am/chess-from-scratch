"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const cache = new Map();
function normalizeFen(fen) {
    //remove fullMoveNumber and halfMoveClock
    const fenParts = fen.split(" ");
    return fenParts.slice(0, 4).join(" ");
}
//Converts a cloud eval to a local eval
function convertCloudEval(cloudEval, activeColor, fen) {
    if (!cloudEval.pvs.length)
        throw new Error("No lines");
    const lines = cloudEval.pvs
        .map((pv) => (0, utils_1.pvToLine)(pv))
        .map((line) => ({ score: line.score, moves: (0, utils_1.uciMovesToPgn)(line.moves, fen) }));
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
    const move = lines[0].moves[0];
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
const wasmSupported = typeof WebAssembly === "object" &&
    WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
const stockfish = new Worker(wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js");
let aborted = false;
let ready = false;
let evaluating = false;
let currentFen = null;
let currentScore = { type: "cp", value: 0 };
let currentDepth = 0;
let currentMove = null;
let currentLines = [];
let game = null;
const options = {
    useNNUE: true,
    useCloudEval: true,
    threads: 1,
    multiPv: 3,
    depth: 18,
    showLinesAfterDepth: 12,
};
//Startup
stockfish.postMessage("uci");
stockfish.postMessage("isready");
const onStockfishMessage = (e) => {
    const message = e.data;
    const params = message.split(" ");
    if (params[0] === "readyok") {
        ready = true;
    }
    if (!currentFen)
        return;
    if (params[0] === "info" && !(params.includes("string") || params.includes("currmove"))) {
        aborted = false;
        const info = (0, utils_1.parseInfoMessage)(params);
        if (!info)
            return;
        if (info.score.type === "lowerbound" || info.score.type === "upperbound")
            return;
        const scoreMultiplier = currentFen && currentFen.includes("w") ? 1 : -1;
        if (info.score.type === "cp")
            info.score.value *= scoreMultiplier;
        if (info.multiPV === 1) {
            currentScore = info.score;
            currentDepth = info.depth;
            currentMove = info.pv[0];
            self.postMessage({
                type: "updateScore",
                fen: currentFen,
                score: info.score,
                depth: info.depth,
                move: info.pv[0],
            });
        }
        if (info.depth >= options.showLinesAfterDepth) {
            const line = {
                score: info.score,
                moves: (0, utils_1.uciMovesToPgn)(info.pv.map((move) => (0, utils_1.parseUciMove)(move)), currentFen),
            };
            const index = info.multiPV - 1;
            currentLines[index] = line;
            self.postMessage({ type: "updateLine", fen: currentFen, line, index });
        }
    }
    else if (params[0] === "bestmove") {
        if (aborted) {
            aborted = false;
            return;
        }
        const evaluation = {
            fen: currentFen,
            lines: currentLines,
            depth: currentDepth,
            isCloudEval: false,
            move: currentMove || "",
            score: currentScore,
        };
        self.postMessage({ type: "finalEval", eval: evaluation });
    }
};
//Register event listener
stockfish.addEventListener("message", onStockfishMessage);
self.onmessage = async (e) => {
    const message = e.data;
    if (message.type === "evaluateFen") {
        const fen = message.fen;
        if (!fen)
            return;
        if (fen === currentFen)
            return;
        abort();
        currentFen = fen;
        const cached = getCachedEval(fen);
        if (cached) {
            self.postMessage({ type: "finalEval", eval: cached });
            return;
        }
        else if (options.useCloudEval) {
            const cloudEval = await fetchCloudEval(fen);
            if (cloudEval) {
                self.postMessage({ type: "finalEval", eval: cloudEval });
                return;
            }
        }
        evaluating = true;
        stockfish.postMessage("setoption name Threads value " + options.threads);
        stockfish.postMessage("setoption name MultiPV value " + options.multiPv);
        stockfish.postMessage("setoption name UCI_AnalyseMode value true");
        stockfish.postMessage("position fen " + fen);
        if (options.depth === -1)
            stockfish.postMessage("go infinite");
        else
            stockfish.postMessage("go depth " + options.depth);
    }
};
function abort() {
    currentMove = null;
    currentLines = [];
    currentScore = { type: "cp", value: 0 };
    currentDepth = 0;
    aborted = true;
    stockfish.postMessage("stop");
}
function getCachedEval(fen) {
    const normalizedFen = normalizeFen(fen);
    const cached = cache.get(normalizedFen);
    if (cached) {
        if (cached.isCloudEval && !options.useCloudEval)
            return null;
        if (cached.depth < options.depth)
            return null;
        if (cached.lines.length < options.multiPv)
            return null;
        return cached;
    }
    return null;
}
async function fetchCloudEval(fen) {
    const formatted = (0, utils_1.formatFen)(fen);
    try {
        const res = await axios_1.default.get("https://lichess.org/api/cloud-eval", {
            params: {
                fen: formatted,
                multiPv: options.multiPv,
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
}
// function shouldReevaluate(fen: string, newOptions: Options): boolean {
//   if (currentFen !== fen) {
//     currentFen = fen;
//     return true;
//   }
//   if (newOptions.useCloudEval !== options.useCloudEval) return true;
//   if (newOptions.useNNUE !== options.useNNUE) return true;
//   if (newOptions.multiPv > options.multiPv) return true;
//   if (newOptions.depth > options.depth) return true;
//   if (newOptions.threads > options.threads) return true;
//   return false;
// }

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stop = exports.getEvaluation = exports.startup = exports.ready = exports.setSkillLevel = exports.limitStrength = exports.initialize = void 0;
function initialize(stockfish) {
    stockfish.postMessage("uci");
}
exports.initialize = initialize;
function limitStrength(value, stockfish) {
    stockfish.postMessage(`setoption name UCI_LimitStrength value ${value}`);
}
exports.limitStrength = limitStrength;
function setSkillLevel(value, stockfish) {
    if (value < 0 || value > 20)
        throw new Error(`Value: ${value} is outside the range for option SkillLevel - please enter a value between 0 and 20`);
    stockfish.postMessage(`setoption name Skill Level value ${value}`);
}
exports.setSkillLevel = setSkillLevel;
const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 10000));
function ready(stockfish) {
    return __awaiter(this, void 0, void 0, function* () {
        const isReady = new Promise((resolve, reject) => {
            const handler = (e) => {
                if (e.data === "readyok") {
                    stockfish.removeEventListener("message", handler);
                    resolve(true);
                }
            };
            stockfish.addEventListener("message", handler);
            stockfish.postMessage("isready");
        });
        const ready = yield Promise.race([isReady, timeout]);
        return ready;
    });
}
exports.ready = ready;
function startup(stockfish) {
    return __awaiter(this, void 0, void 0, function* () {
        const isReady = yield ready(stockfish);
        if (isReady) {
            const getOptions = new Promise((resolve, reject) => {
                let options = [];
                const handler = (e) => {
                    const args = e.data.split(" ");
                    if (args[0] === "option") {
                        let reading = "";
                        let name = "";
                        let type = "";
                        let defaultValue = "";
                        args.forEach((arg) => {
                            if (arg === "name" || arg === "type" || arg === "default") {
                                reading = arg;
                            }
                            else {
                                switch (reading) {
                                    case "name":
                                        if (name.length >= 1)
                                            name = name + " " + arg;
                                        else
                                            name = arg;
                                        break;
                                    case "type":
                                        type = arg;
                                        break;
                                    case "default":
                                        if (defaultValue.length >= 1)
                                            defaultValue = defaultValue + " " + arg;
                                        else
                                            defaultValue = arg;
                                        break;
                                    default:
                                        break;
                                }
                            }
                        });
                        options.push({ name, type, defaultValue });
                    }
                    else if (args[0] === "uciok") {
                        stockfish.removeEventListener("message", handler);
                        resolve(options);
                    }
                };
                stockfish.addEventListener("message", handler);
                stockfish.postMessage("uci");
            });
            const options = yield Promise.race([getOptions, timeout]);
            if (options) {
                return {
                    ready: true,
                    options,
                };
            }
            else {
                throw new Error("something went wrong");
            }
        }
        else {
            throw new Error("engine timeout");
        }
    });
}
exports.startup = startup;
//Conver UCI info message into evaluation object
function parseEvalInfo(args) {
    const values = ["depth", "multipv", "score", "seldepth", "time", "nodes", "nps", "time", "pv", "hashfull"];
    let reading = "";
    let evaluation = {
        depth: 0,
        multipv: 1,
        score: {
            type: "cp",
            value: 0,
        },
        seldepth: 0,
        pv: [],
    };
    //Assign args to values
    args.forEach((arg) => {
        if (values.includes(arg)) {
            reading = arg;
        }
        else {
            switch (reading) {
                case "depth":
                    evaluation.depth = parseInt(arg);
                    break;
                case "multipv":
                    evaluation.multipv = parseInt(arg);
                    break;
                case "seldepth":
                    evaluation.seldepth = parseInt(arg);
                    break;
                case "score":
                    if (arg === "cp" || arg === "mate" || arg === "upperbound" || arg === "lowerbound") {
                        evaluation.score.type = arg;
                    }
                    else {
                        evaluation.score.value = parseInt(arg);
                    }
                    break;
                case "time":
                    evaluation.time = parseInt(arg);
                    break;
                case "nps":
                    evaluation.nps = parseInt(arg);
                    break;
                case "hashfull":
                    evaluation.hashfull = parseInt(arg);
                    break;
                case "pv":
                    evaluation.pv.push(arg);
                    break;
                default:
                    break;
            }
        }
    });
    return evaluation;
}
function getEvaluation(evaler, options = { depth: 10, fen: "", useNNUE: false }, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const stockfish = evaler;
        let result;
        let timer;
        const evaluation = new Promise((resolve, reject) => {
            const handler = (e) => {
                if (!e.data)
                    return;
                const args = e.data.split(" ");
                const multiplier = options.fen.split(" ")[1] === "w" ? 1 : -1;
                //Ignore some unnecessary messages
                if (args[0] === "info" && !(args.includes("string") || args.includes("currmove"))) {
                    const evaluation = parseEvalInfo(args);
                    evaluation.score.value = evaluation.score.value * multiplier;
                    if (evaluation.score.type !== "lowerbound" && evaluation.score.type !== "upperbound") {
                        result = evaluation;
                        callback(evaluation);
                    }
                }
                if (args[0] === "bestmove") {
                    clearTimeout(timer);
                    stockfish.removeEventListener("message", handler);
                    if (!result)
                        reject("Evaluation error");
                    if (result)
                        resolve(result);
                }
                if (args[0] === "bestmove" && (result === null || result === void 0 ? void 0 : result.depth) === options.depth) {
                }
            };
            stockfish.addEventListener("message", handler);
            stockfish.postMessage(`setoption name Use NNUE value ${options.useNNUE}`);
            stockfish.postMessage("setoption name UCI_AnalyseMode value true");
            stockfish.postMessage("position fen " + options.fen);
            stockfish.postMessage("go depth " + options.depth);
            stockfish.postMessage("eval");
            timer = setTimeout(() => {
                stockfish.removeEventListener("message", handler);
                reject(new Error("timeout waiting for response on command `evaluation`"));
            }, 120000);
        });
        const final = yield evaluation;
        return final;
    });
}
exports.getEvaluation = getEvaluation;
function stop(stockfish, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        let timer;
        const stop = new Promise((resolve, reject) => {
            const handler = (e) => {
                const args = e.data.split(" ");
                if (args[0] === "bestmove") {
                    //clear timeout on correct response
                    clearTimeout(timer);
                    stockfish.removeEventListener("message", handler);
                    resolve(true);
                }
            };
            stockfish.addEventListener("message", handler);
            stockfish.postMessage("stop");
            timer = setTimeout(() => {
                stockfish.removeEventListener("message", handler);
                reject(new Error("timeout waiting for response on command `stop`"));
            }, timeout || 10000);
        });
        const stopped = yield stop;
        return stopped;
    });
}
exports.stop = stop;

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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stop = exports.getEvaluation = exports.startup = exports.ready = exports.setSkillLevel = exports.limitStrength = exports.initialize = void 0;
function initialize(stockfish) {
    stockfish.postMessage("uci");
}
exports.initialize = initialize;
function limitStrength(value, stockfish) {
    stockfish.postMessage("setoption name UCI_LimitStrength value ".concat(value));
}
exports.limitStrength = limitStrength;
function setSkillLevel(value, stockfish) {
    if (value < 0 || value > 20)
        throw new Error("Value: ".concat(value, " is outside the range for option SkillLevel - please enter a value between 0 and 20"));
    stockfish.postMessage("setoption name Skill Level value ".concat(value));
}
exports.setSkillLevel = setSkillLevel;
var timeout = new Promise(function (resolve) { return setTimeout(function () { return resolve(false); }, 10000); });
function ready(stockfish) {
    return __awaiter(this, void 0, void 0, function () {
        var isReady, ready;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isReady = new Promise(function (resolve, reject) {
                        var handler = function (e) {
                            if (e.data === "readyok") {
                                stockfish.removeEventListener("message", handler);
                                resolve(true);
                            }
                        };
                        stockfish.addEventListener("message", handler);
                        stockfish.postMessage("isready");
                    });
                    return [4 /*yield*/, Promise.race([isReady, timeout])];
                case 1:
                    ready = _a.sent();
                    return [2 /*return*/, ready];
            }
        });
    });
}
exports.ready = ready;
function startup(stockfish) {
    return __awaiter(this, void 0, void 0, function () {
        var isReady, getOptions, options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ready(stockfish)];
                case 1:
                    isReady = _a.sent();
                    if (!isReady) return [3 /*break*/, 3];
                    getOptions = new Promise(function (resolve, reject) {
                        var options = [];
                        var handler = function (e) {
                            var args = e.data.split(" ");
                            if (args[0] === "option") {
                                var reading_1 = "";
                                var name_1 = "";
                                var type_1 = "";
                                var defaultValue_1 = "";
                                args.forEach(function (arg) {
                                    if (arg === "name" || arg === "type" || arg === "default") {
                                        reading_1 = arg;
                                    }
                                    else {
                                        switch (reading_1) {
                                            case "name":
                                                if (name_1.length >= 1)
                                                    name_1 = name_1 + " " + arg;
                                                else
                                                    name_1 = arg;
                                                break;
                                            case "type":
                                                type_1 = arg;
                                                break;
                                            case "default":
                                                if (defaultValue_1.length >= 1)
                                                    defaultValue_1 = defaultValue_1 + " " + arg;
                                                else
                                                    defaultValue_1 = arg;
                                                break;
                                            default:
                                                break;
                                        }
                                    }
                                });
                                options.push({ name: name_1, type: type_1, defaultValue: defaultValue_1 });
                            }
                            else if (args[0] === "uciok") {
                                stockfish.removeEventListener("message", handler);
                                resolve(options);
                            }
                        };
                        stockfish.addEventListener("message", handler);
                        stockfish.postMessage("uci");
                    });
                    return [4 /*yield*/, Promise.race([getOptions, timeout])];
                case 2:
                    options = _a.sent();
                    if (options) {
                        return [2 /*return*/, {
                                ready: true,
                                options: options,
                            }];
                    }
                    else {
                        throw new Error("something went wrong");
                    }
                    return [3 /*break*/, 4];
                case 3: throw new Error("engine timeout");
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.startup = startup;
//Conver UCI info message into evaluation object
function parseEvalInfo(args) {
    var values = ["depth", "multipv", "score", "seldepth", "time", "nodes", "nps", "time", "pv", "hashfull"];
    var reading = "";
    var evaluation = {
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
    args.forEach(function (arg) {
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
function getEvaluation(evaler, options, callback) {
    if (options === void 0) { options = { depth: 10, fen: "", useNNUE: false }; }
    return __awaiter(this, void 0, void 0, function () {
        var stockfish, result, timer, evaluation, final;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stockfish = evaler;
                    evaluation = new Promise(function (resolve, reject) {
                        var handler = function (e) {
                            if (!e.data)
                                return;
                            var args = e.data.split(" ");
                            var multiplier = options.fen.split(" ")[1] === "w" ? 1 : -1;
                            //Ignore some unnecessary messages
                            if (args[0] === "info" && !(args.includes("string") || args.includes("currmove"))) {
                                var evaluation_1 = parseEvalInfo(args);
                                evaluation_1.score.value = evaluation_1.score.value * multiplier;
                                if (evaluation_1.score.type !== "lowerbound" && evaluation_1.score.type !== "upperbound") {
                                    result = evaluation_1;
                                    callback(evaluation_1);
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
                        stockfish.postMessage("setoption name Use NNUE value ".concat(options.useNNUE));
                        stockfish.postMessage("setoption name UCI_AnalyseMode value true");
                        stockfish.postMessage("position fen " + options.fen);
                        stockfish.postMessage("go depth " + options.depth);
                        stockfish.postMessage("eval");
                        timer = setTimeout(function () {
                            stockfish.removeEventListener("message", handler);
                            reject(new Error("timeout waiting for response on command `evaluation`"));
                        }, 120000);
                    });
                    return [4 /*yield*/, evaluation];
                case 1:
                    final = _a.sent();
                    return [2 /*return*/, final];
            }
        });
    });
}
exports.getEvaluation = getEvaluation;
function stop(stockfish, timeout) {
    return __awaiter(this, void 0, void 0, function () {
        var timer, stop, stopped;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stop = new Promise(function (resolve, reject) {
                        var handler = function (e) {
                            var args = e.data.split(" ");
                            if (args[0] === "bestmove") {
                                //clear timeout on correct response
                                clearTimeout(timer);
                                stockfish.removeEventListener("message", handler);
                                resolve(true);
                            }
                        };
                        stockfish.addEventListener("message", handler);
                        stockfish.postMessage("stop");
                        timer = setTimeout(function () {
                            stockfish.removeEventListener("message", handler);
                            reject(new Error("timeout waiting for response on command `stop`"));
                        }, timeout || 10000);
                    });
                    return [4 /*yield*/, stop];
                case 1:
                    stopped = _a.sent();
                    return [2 /*return*/, stopped];
            }
        });
    });
}
exports.stop = stop;

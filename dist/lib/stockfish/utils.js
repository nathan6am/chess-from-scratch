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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uciMovesToPgn = exports.pvToLine = exports.parseUciMove = exports.parseInfoMessage = exports.formatFen = void 0;
const Chess = __importStar(require("@/lib/chess"));
const lodash_1 = __importDefault(require("lodash"));
//Remove En Passant target if it is not a legal move
function formatFen(fen) {
    const game = Chess.createGame({ startPosition: fen });
    if (!game.legalMoves.some((move) => move.capture && move.end === game.enPassantTarget)) {
        const args = fen.split(" ");
        args[3] = "-";
        return (fen = args.join(" "));
    }
    return fen;
}
exports.formatFen = formatFen;
function parseInfoMessage(params) {
    const values = [
        "depth",
        "multipv",
        "score",
        "seldepth",
        "time",
        "nodes",
        "nps",
        "time",
        "pv",
        "hashfull",
    ];
    let reading = "";
    let evaluation = {
        depth: 0,
        multiPV: 1,
        score: {
            type: "cp",
            value: 0,
        },
        time: 0,
        seldepth: 0,
        pv: [],
    };
    //Assign args to values
    params.forEach((param) => {
        if (values.includes(param)) {
            reading = param;
        }
        else {
            switch (reading) {
                case "depth":
                    evaluation.depth = parseInt(param);
                    break;
                case "multipv":
                    evaluation.multiPV = parseInt(param);
                    break;
                case "seldepth":
                    evaluation.seldepth = parseInt(param);
                    break;
                case "score":
                    if (param === "cp" ||
                        param === "mate" ||
                        param === "upperbound" ||
                        param === "lowerbound") {
                        evaluation.score.type = param;
                    }
                    else {
                        evaluation.score.value = parseInt(param);
                    }
                    break;
                case "time":
                    evaluation.time = parseInt(param);
                    break;
                case "nps":
                    evaluation.nps = parseInt(param);
                    break;
                case "hashfull":
                    evaluation.hashfull = parseInt(param);
                    break;
                case "pv":
                    evaluation.pv.push(param);
                    break;
                default:
                    break;
            }
        }
    });
    return evaluation;
}
exports.parseInfoMessage = parseInfoMessage;
function parseUciMove(uci) {
    const args = uci.trim().match(/.{1,2}/g) || [];
    if (!args[0] || ![args[1]])
        throw new Error("invalid uci move");
    let move = {
        start: args[0],
        end: args[1],
    };
    if (args[2])
        move.promotion = args[2];
    return move;
}
exports.parseUciMove = parseUciMove;
//Converts a variation to a line object with score
function pvToLine(pv) {
    if (pv.cp === undefined && pv.mate === undefined)
        throw new Error("Invalid pv object");
    if (!(pv.cp || pv.cp === 0) && !(pv.mate || pv.mate === 0))
        throw new Error("Invalid pv object");
    const score = pv.cp || pv.cp === 0 ? { type: "cp", value: pv.cp } : { type: "mate", value: pv.mate || 0 };
    const moves = pv.moves.split(" ").map((move) => parseUciMove(move));
    return {
        score,
        moves,
    };
}
exports.pvToLine = pvToLine;
function uciMovesToPgn(moves, fen) {
    const game = Chess.createGame({ startPosition: fen });
    const result = [];
    try {
        let currentGame = lodash_1.default.cloneDeep(game);
        moves.forEach((uciMove) => {
            const move = currentGame.legalMoves.find((move) => move.start === uciMove.start &&
                move.end === uciMove.end &&
                move.promotion === uciMove.promotion);
            if (!move) {
                return result;
            }
            else {
                result.push(move.PGN);
                const nextGame = Chess.move(currentGame, move);
                currentGame = nextGame;
            }
        });
        return result;
    }
    catch (e) {
        console.error(e);
        return [];
    }
}
exports.uciMovesToPgn = uciMovesToPgn;

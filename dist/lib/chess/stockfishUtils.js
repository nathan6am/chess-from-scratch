"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInfoMessage = exports.parseUciMove = void 0;
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
function parseInfoMessage(data) {
    const args = data.trim().split(" ");
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
                    evaluation.multiPV = parseInt(arg);
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
                    evaluation.pv.push(parseUciMove(arg));
                    break;
                default:
                    break;
            }
        }
    });
    return evaluation;
}
exports.parseInfoMessage = parseInfoMessage;

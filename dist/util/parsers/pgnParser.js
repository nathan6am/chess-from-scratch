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
exports.moveHistoryToMoveText = exports.gameDataToPgn = exports.encodeGameToPgn = exports.parseMoveText = exports.parsePgn = exports.treeFromLine = exports.mainLineFromTreeArray = exports.tagDataToPGNString = exports.pgnToJson = exports.encodeCommentFromNodeData = void 0;
const Chess = __importStar(require("../../lib/chess"));
const uuid_1 = require("uuid");
const misc_1 = require("../misc");
const luxon_1 = require("luxon");
const lodash_1 = __importDefault(require("lodash"));
const getEntries = (obj) => Object.entries(obj);
const tagExpr = /^\[.* ".*"\]$/;
const bracketsExpr = /^\[(.+(?=\]$))\]$/;
const quoteDelimited = /"[^"]+"/g;
const commandDelimited = /\[%[^\[\]]+\]/g;
const commandTypeExpr = /\B\%\w+/;
function extractCommands(comment) {
    const knownTypes = ["%csl", "%cal", "%clk"];
    const commandsRaw = comment.match(commandDelimited)?.map((str) => str.replace(bracketsExpr, "$1"));
    const remainingComment = comment.replace(commandDelimited, "").trim();
    let commands = [];
    if (commandsRaw && commandsRaw.length) {
        commandsRaw.forEach((str) => {
            const commandType = str.match(commandTypeExpr);
            if (!commandType || !commandType[0])
                return;
            const type = knownTypes.find((type) => type === commandType[0]);
            const value = str.replace(commandTypeExpr, "").trim();
            if (type && value) {
                commands.push({ type, value });
            }
        });
    }
    return {
        commands,
        remainingComment,
    };
}
//console.log(extractCommands(sampleArrows));
function isArrowColor(str) {
    const colors = ["R", "O", "G", "B"];
    if (colors.includes(str))
        return true;
    return false;
}
function parseCommands(commands) {
    let data = {};
    commands.forEach((command) => {
        if (command.type === "%csl") {
            const markedSquareNotations = command.value.split(",");
            let markedSquares = [];
            markedSquareNotations.forEach((notation) => {
                const color = notation.charAt(0);
                const square = notation.slice(1);
                if (Chess.isSquare(square) && isArrowColor(color)) {
                    markedSquares.push({ color, square });
                }
            });
            if (markedSquares.length)
                data.markedSquares = markedSquares;
        }
        else if (command.type === "%cal") {
            const arrowNotations = command.value.split(",");
            let arrows = [];
            arrowNotations.forEach((str) => {
                const color = str.charAt(0);
                const [start, end] = str
                    .slice(1)
                    .split(/(.{2})/)
                    .filter((x) => x.length === 2);
                if (isArrowColor(color) && Chess.isSquare(start) && Chess.isSquare(end)) {
                    arrows.push({ color, start, end });
                }
            });
            if (arrows.length)
                data.arrows = arrows;
        }
        else if (command.type === "%clk") {
            const [hours, minutes, seconds] = command.value.split(":").map((str) => parseInt(str));
            const timeRemaining = luxon_1.Duration.fromObject({ hours, minutes, seconds });
            data.timeRemaining = timeRemaining.toMillis();
        }
    });
    return data;
}
function encodeCommentFromNodeData(data, { includeArrows = true, includeTimeRemaining = true, includeComments = true, }) {
    let commentString = "";
    if (data.timeRemaining && includeTimeRemaining) {
        commentString += `[%clk ${luxon_1.Duration.fromMillis(data.timeRemaining).toISOTime()}] `;
    }
    if (data.markedSquares && data.markedSquares.length && includeArrows) {
        commentString += `[%csl ${data.markedSquares
            .map((markedSquare) => `${markedSquare.color}${markedSquare.square}`)
            .join(",")}] `;
    }
    if (data.arrows && data.arrows.length && includeArrows) {
        commentString += `[%cal ${data.arrows.map((arrow) => `${arrow.color}${arrow.start}${arrow.end}`).join(",")}] `;
    }
    if (data.comment && includeComments) {
        commentString += data.comment;
    }
    if (commentString.length)
        return `{${commentString}} `;
    else
        return "";
}
exports.encodeCommentFromNodeData = encodeCommentFromNodeData;
function parseTag(tag) {
    const string = tag.replace(bracketsExpr, "$1");
    const result = string.match(quoteDelimited);
    if (!result)
        return undefined;
    const value = result[0].replace(/^"(.+(?="$))"$/, "$1");
    const name = string.trim().split(" ")[0];
    return {
        name,
        value,
    };
}
function pgnToJson(pgn) {
    let tags = [];
    let section = "tags";
    //Split PGN into tags/movetext sections
    const args = pgn.split(/(\r\n|\n|\r)/gm);
    let movetext = "";
    args.forEach((arg) => {
        if (section === "tags") {
            if (/(\r\n|\n|\r)/gm.test(arg)) {
            }
            else if (!/\S/.test(arg)) {
                section = "movetext";
            }
            else if (tagExpr.test(arg.trim())) {
                tags.push(arg.trim());
            }
            else
                throw new Error(`Syntax Error: Invalid pgn tag ${arg}`);
        }
        else if (section === "movetext") {
            if (/(\r\n|\n|\r)/gm.test(arg)) {
            }
            else {
                movetext += `${arg.trim()} `;
            }
        }
    });
    const parsedTags = tags.map((tag) => parseTag(tag)).filter(misc_1.notEmpty);
    let tagData = {};
    parsedTags.forEach((tag) => {
        const dictionary = getEntries(tagsDict);
        const pair = dictionary.find(([key, value]) => {
            return value === tag.name;
        });
        const key = pair && pair[0];
        if (key) {
            Object.assign(tagData, { [key]: tag.value });
        }
    });
    return {
        tagData,
        movetext,
    };
}
exports.pgnToJson = pgnToJson;
const tagsDict = {
    event: "Event",
    site: "Site",
    date: "Date",
    round: "Round",
    white: "White",
    black: "Black",
    eloWhite: "WhiteElo",
    eloBlack: "BlackElo",
    titleWhite: "WhiteTitle",
    titleBlack: "BlackTitle",
    result: "Result",
    opening: "Opening",
    variation: "Variation",
    subVariation: "SubVariation",
    eco: "ECO",
    fen: "FEN",
    setUp: "SetUp",
    timeControl: "TimeControl",
    termination: "Termination",
};
function tagDataToPGNString(data) {
    let tagsString = "";
    const dataToEncode = lodash_1.default.cloneDeep(data);
    Object.assign(dataToEncode, {
        event: data.event || "?",
        site: data.site || "?",
        date: data.date || "????.??.??",
        round: data.round || "?",
        white: data.white,
        black: data.black,
        result: data.result || "*",
    });
    const entries = getEntries(dataToEncode);
    entries.forEach(([key, value]) => {
        const keyString = tagsDict[key];
        if (value)
            tagsString += `[${keyString} "${value}"]\r\n`;
    });
    return tagsString;
}
exports.tagDataToPGNString = tagDataToPGNString;
//console.log(pgnToJson(sampleData));
function buildTreeArray(map, parentKey = null) {
    if (parentKey === null) {
        return Array.from(map.values()).filter((node) => !node.parentKey);
    }
    const parentNode = map.get(parentKey);
    if (!parentNode) {
        return Array.from(map.values()).filter((node) => !node.parentKey);
    }
    return parentNode.children;
}
function mainLineFromTreeArray(treeArray) {
    const path = [];
    let currentNode = treeArray[0];
    while (currentNode) {
        path.push(currentNode);
        currentNode = currentNode.children[0];
    }
    return path;
}
exports.mainLineFromTreeArray = mainLineFromTreeArray;
function treeFromLine(line) {
    let map = new Map();
    let parentKey = null;
    const addNode = (data, parentKey) => {
        const key = (0, uuid_1.v4)();
        const newNode = { key, data, parentKey: parentKey, children: [] };
        map.set(newNode.key, newNode);
        if (parentKey) {
            const parentNode = map.get(parentKey);
            if (!parentNode)
                throw new Error("Invalid parent key.");
            parentNode.children.push(newNode);
        }
        return newNode;
    };
    line.forEach((nodeData) => {
        const node = addNode(nodeData, parentKey);
        if (!node)
            throw new Error("line parse failed");
        parentKey = node.key;
    });
    return buildTreeArray(map);
}
exports.treeFromLine = treeFromLine;
function parsePgn(pgn) {
    const { tagData, movetext } = pgnToJson(pgn);
    const startPosition = tagData.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const tree = parseMoveText(movetext, startPosition);
    return {
        tree,
        tagData,
    };
}
exports.parsePgn = parsePgn;
/**
 * Parse standard PGN movetext into initial tree for analysis board
 * @param movetext Standard PGN movetext {@link http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c8.2|- as defined here}
 * @param startPosition FEN string of the start position of the game
 * @returns move tree with parsed data as ``Node[]``
 */
function parseMoveText(movetext, startPosition) {
    let map = new Map();
    const addNode = (data, parentKey) => {
        const key = (0, uuid_1.v4)();
        const newNode = { key, data, parentKey: parentKey, children: [] };
        map.set(newNode.key, newNode);
        if (parentKey) {
            const parentNode = map.get(parentKey);
            if (!parentNode)
                throw new Error("Invalid parent key.");
            parentNode.children.push(newNode);
        }
        return newNode;
    };
    function getPath(key) {
        const destNode = map.get(key);
        if (!destNode)
            return [];
        let path = [];
        let currentNode = destNode;
        while (currentNode) {
            path.unshift(currentNode);
            if (currentNode.parentKey === null)
                break;
            const parentNode = map.get(currentNode.parentKey);
            currentNode = parentNode;
        }
        return path;
    }
    let stream = movetext.replace(/(\r\n|\n|\r)/gm, "").trim();
    var lastIndex = stream.lastIndexOf(" ");
    stream = stream.substring(0, lastIndex);
    //console.log(stream);
    const initialGame = Chess.createGame({ startPosition: startPosition });
    //let currentGame = initialGame;
    let reading = "unknown";
    let prevChar = " ";
    let currentData = {
        comment: null,
        annotations: [],
    };
    let currentMove = "";
    let moveCount = "1";
    let comment = "";
    let annotation = "";
    //Stack to maintian move to return to when closing a variation
    let variationStack = [];
    let currentParent = null;
    const isDigit = (char) => {
        const exp = /\d/;
        return exp.test(char);
    };
    //Get the current game state as a game object based on the parent of the current node being parsed
    const getCurrentGame = () => {
        const node = currentParent;
        if (!node)
            return initialGame;
        else {
            const currentPath = getPath(node.key);
            return Chess.gameFromNodeData(node.data, initialGame.config.startPosition, currentPath.map((node) => node.data));
        }
    };
    //Add the current node/data to the tree and reset values
    const postCurrentData = () => {
        const pgn = currentData.pgn;
        if (!pgn)
            throw new Error("Invalid PGN string");
        const currentGame = getCurrentGame();
        //Verify the move text is a valid/legal move
        let move = currentGame.legalMoves.find((move) => move.PGN === pgn.replace("#", "+"));
        if (!move) {
            const withoutExtraChars = currentGame.legalMoves.find((move) => move.PGN.replace(/[#+x]/g, "") === pgn.replace(/[#+x]/g, ""));
            if (withoutExtraChars) {
                move = withoutExtraChars;
            }
            else {
                const cleaned = pgn.replace(/[#+x]/g, "");
                const altPattern = /^[a-h]{2}$/;
                const isAlternatePawnCapture = altPattern.test(cleaned);
                if (isAlternatePawnCapture) {
                    const startFile = cleaned.charAt(0);
                    const endFile = cleaned.charAt(1);
                    const pattern = `^${startFile}x?${endFile}[1-8]$`;
                    const expr = new RegExp(pattern);
                    const correctMove = currentGame.legalMoves.find((move) => expr.test(move.PGN));
                    if (correctMove) {
                        move = correctMove;
                    }
                }
            }
        }
        if (!move) {
            console.log(pgn);
            console.log(currentGame.legalMoves);
            throw new Error(`Invalid move: ${pgn}`);
        }
        const parentKey = currentParent?.key || null;
        const path = parentKey ? getPath(parentKey) : [];
        //Generate node data from game/move
        const data = Chess.nodeDataFromMove(currentGame, move, path.length + 1);
        data.annotations = currentData.annotations || [];
        if (currentData.comment) {
            const { commands, remainingComment } = extractCommands(currentData.comment);
            data.comment = remainingComment;
            Object.assign(data, parseCommands(commands));
        }
        else {
            data.comment = null;
        }
        const node = addNode(data, parentKey);
        if (!node)
            throw new Error("Something went wrong");
        //Set parent to the newly created node and reset data
        currentParent = node;
        currentData = {
            comment: null,
            annotations: [],
        };
    };
    for (let char of stream) {
        if (reading === "comment") {
            if (char === "}") {
                reading = "unknown";
                currentData.comment = comment;
                comment = "";
            }
            else {
                comment += char;
            }
        }
        else if (char === "{") {
            reading = "comment";
        }
        else if (char === "}" && reading !== "comment") {
            throw new Error("Invalid pgn");
        }
        else if (reading === "annotation") {
            if (char === " ") {
                if (!annotation.length)
                    throw new Error("Invalid PGN; annotaion flag `$` not followed by valid NAG");
                if (currentData.annotations) {
                    currentData.annotations.push(parseInt(annotation));
                }
                else {
                    currentData.annotations = [parseInt(annotation)];
                }
                annotation = "";
                reading = "unknown";
            }
            else if (char === "(") {
                if (currentData.annotations) {
                    currentData.annotations.push(parseInt(annotation));
                }
                else {
                    currentData.annotations = [parseInt(annotation)];
                }
                annotation = "";
                if (currentData.pgn)
                    postCurrentData();
                //Start a new variation;
                const path = currentParent ? getPath(currentParent["key"]) : [];
                const prevParent = path[path.length - 2] || null;
                variationStack.push(currentParent);
                currentParent = prevParent;
                reading = "unknown";
            }
            else if (char === ")") {
                if (currentData.annotations) {
                    currentData.annotations.push(parseInt(annotation));
                }
                else {
                    currentData.annotations = [parseInt(annotation)];
                }
                annotation = "";
                if (currentData.pgn)
                    postCurrentData();
                //Close variation; pop last node off the variation stack and set to current parent
                const nextParent = variationStack.pop();
                currentParent = nextParent || null;
                reading = "unknown";
            }
            else if (!isDigit(char)) {
                console.log(`Character:"${char}"`);
                throw new Error("Invalid NAG annotation code");
            }
            else {
                annotation += char;
            }
        }
        else if (char === "$") {
            reading = "annotation";
        }
        else if ((prevChar === " " || prevChar === ")" || prevChar === "}" || prevChar === "(") && isDigit(char)) {
            reading = "move-count";
            moveCount = char;
            if (currentData.pgn)
                postCurrentData();
        }
        else if (char === "(") {
            if (currentData.pgn)
                postCurrentData();
            const path = currentParent ? getPath(currentParent["key"]) : [];
            const prevParent = path[path.length - 2] || null;
            variationStack.push(currentParent);
            currentParent = prevParent;
            console.log(`variationstack: ${variationStack.map((node) => node && node.data.PGN)}`);
        }
        else if (char === ")") {
            if (currentData.pgn)
                postCurrentData();
            const nextParent = variationStack.pop();
            currentParent = nextParent || null;
        }
        else if (reading === "move-count") {
            if (isDigit(char))
                moveCount += char;
            else if (char === " ")
                reading = "pgn";
            else if (char !== ".") {
                currentMove = char;
                reading = "pgn";
            }
        }
        else if (reading === "pgn") {
            if (char === " " && currentMove.length) {
                reading = "unknown";
                currentData.pgn = currentMove;
                currentMove = "";
            }
            else if (char === " ") {
                reading = "unknown";
            }
            else
                currentMove += char;
        }
        else if (reading === "unknown") {
            const specialChars = [" ", "$", "(", ")", "{", "}"];
            if (!isDigit(char) && !specialChars.includes(char)) {
                if (currentData.pgn)
                    postCurrentData();
                reading = "pgn";
                currentMove = char;
            }
        }
        prevChar = char;
    }
    //Add last node if not already in tree
    if (currentData.pgn)
        postCurrentData();
    //Recursively build map into tree array
    return buildTreeArray(map);
}
exports.parseMoveText = parseMoveText;
function encodeGameToPgn(game) {
    const { w, b } = game.players;
    let tagData = {
        white: w.username || undefined,
        black: b.username || undefined,
        eloWhite: `${w.rating}` || undefined,
        eloBlack: `${b.rating}` || undefined,
        event: "NextChess Online Game",
        site: "NextChess.dev",
        result: encodeOutcome(game.data.outcome),
        date: new Date().toISOString().slice(0, 10),
    };
    const termination = encodeTermination(game.data.outcome);
    if (game.data.outcome && termination) {
        tagData.termination = termination;
    }
    const tagSection = tagDataToPGNString(tagData);
    const movetext = moveHistoryToMoveText(game.data.moveHistory) + ` ${encodeOutcome(game.data.outcome)}`;
    return tagSection + "\r\n" + movetext;
}
exports.encodeGameToPgn = encodeGameToPgn;
function gameDataToPgn(game, tags) {
    let tagData = tags;
    const termination = encodeTermination(game.outcome);
    if (game.outcome && termination) {
        tagData.termination = termination;
    }
    const tagSection = tagDataToPGNString(tagData);
    const movetext = moveHistoryToMoveText(game.moveHistory) + ` ${encodeOutcome(game.outcome)}`;
    return tagSection + "\r\n" + movetext;
}
exports.gameDataToPgn = gameDataToPgn;
function moveHistoryToMoveText(moveHistory) {
    let moveText = "";
    moveHistory.forEach((fullmove, idx) => {
        moveText += `${idx + 1}. ${fullmove[0].PGN} `;
        if (fullmove[0].timeRemaining !== undefined && fullmove[0].timeRemaining !== null)
            moveText += `{ [%clk ${luxon_1.Duration.fromMillis(fullmove[0].timeRemaining).toISOTime()}] } `;
        if (fullmove[1]) {
            if (fullmove[0].timeRemaining !== undefined && fullmove[0].timeRemaining !== null)
                moveText += `${idx + 1}... `;
            moveText += `${fullmove[1].PGN} `;
            if (fullmove[1].timeRemaining !== undefined && fullmove[1].timeRemaining !== null)
                moveText += `{ [%clk ${luxon_1.Duration.fromMillis(fullmove[1].timeRemaining).toISOTime()}] } `;
        }
    });
    return moveText;
}
exports.moveHistoryToMoveText = moveHistoryToMoveText;
function encodeOutcome(outcome) {
    if (!outcome)
        return "*";
    switch (outcome.result) {
        case "w":
            return "1-0";
        case "b":
            return "0-1";
        case "d":
            return "1/2-1/2";
        default:
            return "*";
    }
}
const encodeTermination = (outcome) => {
    let termination = "";
    if (!outcome)
        return null;
    const { result, by } = outcome;
    if (result === "w")
        termination += "White wins";
    else if (result === "b")
        termination += "Black wins";
    else if (result === "d")
        termination += "Draw";
    if (by === "checkmate")
        termination += " by checkmate";
    else if (by === "resignation")
        termination += " by resignation";
    else if (by === "timeout")
        termination += " on time";
    else if (by === "stalemate")
        termination += " by stalemate";
    else if (by === "insufficient")
        termination += " by insufficient material";
    else if (by === "repetition")
        termination += " by repetition";
    else if (by === "agreement")
        termination += " by agreement";
    else if (by === "50-move-rule")
        termination += " by 50 move rule";
    else if (by === "abandonment")
        termination += " by abandonment";
};

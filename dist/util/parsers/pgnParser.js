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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMoveText = exports.mainLineToMoveHistory = exports.mainLineFromTreeArray = exports.pgnToJson = void 0;
const Chess = __importStar(require("../../lib/chess"));
const uuid_1 = require("uuid");
const misc_1 = require("../misc");
const getEntries = (obj) => Object.entries(obj);
const tagExpr = /^\[.* ".*"\]$/;
const bracketsExpr = /^\[(.+(?=\]$))\]$/;
const quoteDelimited = /"[^"]+"/g;
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
};
function tagDataToPGNString(data) {
    let tagsString = "";
    Object.assign(data, {
        event: data.event || "?",
        site: data.site || "?",
        date: data.date || "????.??.??",
        round: data.round || "?",
        white: data.white,
        black: data.black,
        result: data.result || "*",
    });
    const entries = getEntries(data);
    entries.forEach(([key, value]) => {
        const keyString = tagsDict[key];
        if (value)
            tagsString += `[${keyString} "${value}"]\r\n`;
    });
    return tagsString;
}
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
function mainLineToMoveHistory(line) { }
exports.mainLineToMoveHistory = mainLineToMoveHistory;
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
    let stream = movetext.replace(/(\r\n|\n|\r)/gm, "");
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
        const move = currentGame.legalMoves.find((move) => move.PGN === pgn);
        if (!move) {
            console.log(pgn);
            throw new Error(`Invalid move: ${pgn}`);
        }
        const parentKey = (currentParent === null || currentParent === void 0 ? void 0 : currentParent.key) || null;
        const path = parentKey ? getPath(parentKey) : [];
        //Generate node data from game/move
        const data = Chess.nodeDataFromMove(currentGame, move, path.length + 1);
        data.comment = currentData.comment || null;
        data.annotations = currentData.annotations || [];
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

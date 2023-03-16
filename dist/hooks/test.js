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
exports.pgnToTreeArray = void 0;
const Chess = __importStar(require("../lib/chess"));
const uuid_1 = require("uuid");
const misc_1 = require("../util/misc");
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
    const args = pgn.split(/(\r\n|\n|\r)/gm);
    console.log(args);
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
    return {
        tags: parsedTags,
        movetext: movetext.trim(),
    };
}
const testString = `1. e4  d6  {asdssssd} 2. d4  e5  3. Nc3 $10 exd4  4. Qxd4  (4. Nb1  c5  5. Nf3  Nc6  6. Bd3  (6. c3  )(6. Ke2  ) 6... Nf6  {another comment} ) 4... Nc6  5. Bb5 `;
function parsePGN(pgn) {
    const tree = new Map();
    function addNode(node, parentKey) {
        console.log(node);
        console.log(parentKey);
        const newNode = Object.assign(Object.assign({}, node), { parentKey: parentKey });
        tree.set(node.key, newNode);
        if (parentKey) {
            const parentNode = tree.get(parentKey);
            if (!parentNode) {
                console.log(`Error: parent node with key ${parentKey} not found`);
                return;
            }
            parentNode.children.push(newNode);
        }
    }
    const newNode = () => ({
        key: (0, uuid_1.v4)(),
        data: { PGN: null, comment: null, moveCount: [1, 0] },
        children: [],
    });
    let currentNode;
    let currentMove = "";
    let prevNode = null;
    let inComment = false;
    let comment = "";
    let stackTrace = [];
    let prevChar = " ";
    let count = "";
    let moveCounter = [1, 0];
    let inMoveCount = false;
    currentNode = newNode();
    const isDigit = (char) => {
        const exp = /\d/;
        return exp.test(char);
    };
    for (const char of pgn) {
        if (inComment) {
            if (char === "}") {
                inComment = false;
                prevChar = char;
                if (!currentNode)
                    throw new Error("Invalid pgn");
                currentNode.data.comment = comment;
            }
            comment += char;
        }
        else if (char === "{") {
            inComment = true;
        }
        else if (char === "}" && !inComment) {
            throw new Error("Invalid pgn");
        }
        else {
            if ((prevChar === " " || prevChar === ")" || prevChar === "}" || prevChar === "(") && isDigit(char)) {
                if (inMoveCount)
                    throw new Error("Invalid pgn");
                inMoveCount = true;
                count += char;
                if (currentNode.data.PGN) {
                    const node = currentNode;
                    if (!node || !node.data.PGN)
                        throw new Error("Invalid pgn");
                    addNode(node, stackTrace[stackTrace.length - 1] || null);
                    prevNode = Object.assign(Object.assign({}, node), { parentKey: stackTrace[stackTrace.length - 1] || null });
                    currentNode = newNode();
                    currentMove = "";
                }
                else {
                    currentNode = newNode();
                    currentMove = "";
                }
            }
            else if (inMoveCount) {
                if (char !== "." && char !== " " && !isDigit(char)) {
                    console.log(char);
                    console.log(prevChar);
                    throw new Error("Invalid pgn");
                }
                if (isDigit(char)) {
                    count += char;
                }
                if (char === "." && isDigit(prevChar)) {
                    moveCounter[0] = parseInt(count);
                    count = "";
                }
                if (char === "." && prevChar === ".") {
                    moveCounter[1] = 1;
                }
                if (char === " ") {
                    console.log("exit move count");
                    inMoveCount = false;
                    currentNode = newNode();
                }
            }
            else if (char === "(") {
                if (prevNode) {
                    stackTrace.push(prevNode.key);
                }
                if (currentNode.data.PGN) {
                    addNode(currentNode, stackTrace[stackTrace.length - 1] || null);
                    prevNode = Object.assign(Object.assign({}, currentNode), { parentKey: stackTrace[stackTrace.length - 1] || null });
                    currentNode = newNode();
                    currentMove = "";
                }
            }
            else if (char === ")") {
                if (!currentNode)
                    throw new Error("Invalid pgn");
                if (!currentNode.data.PGN) {
                    stackTrace.pop();
                }
                else {
                    addNode(currentNode, stackTrace[stackTrace.length - 1] || null);
                    prevNode = Object.assign(Object.assign({}, currentNode), { parentKey: stackTrace[stackTrace.length - 1] || null });
                    stackTrace.pop();
                    currentNode = newNode();
                    currentMove = "";
                }
            }
            else if (char === " ") {
                if (!currentNode)
                    throw new Error("Invalid pgn");
                if (currentMove.length) {
                    currentNode.data.PGN = currentMove;
                }
                currentMove = "";
            }
            else {
                if (currentNode.data.PGN && prevChar === " ") {
                    addNode(currentNode, stackTrace[stackTrace.length - 1] || null);
                    prevNode = Object.assign(Object.assign({}, currentNode), { parentKey: stackTrace[stackTrace.length - 1] || null });
                    currentMove = "";
                    currentNode = newNode();
                }
                currentMove += char;
            }
        }
        prevChar = char;
    }
    return tree;
}
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
function pgnToTreeArray(pgn, startPosition) {
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
    let stream = pgn.replace(/(\r\n|\n|\r)/gm, "");
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
    let variationStack = [];
    let currentParent = null;
    const isDigit = (char) => {
        const exp = /\d/;
        return exp.test(char);
    };
    const getCurrentGame = () => {
        const node = currentParent;
        if (!node)
            return initialGame;
        else {
            const currentPath = getPath(node.key);
            return Chess.gameFromNodeData(node.data, initialGame.config.startPosition, currentPath.map((node) => node.data));
        }
    };
    const postCurrentData = () => {
        const pgn = currentData.pgn;
        if (!pgn)
            throw new Error("Invalid PGN string");
        const currentGame = getCurrentGame();
        const move = currentGame.legalMoves.find((move) => move.PGN === pgn);
        if (!move) {
            console.log(pgn);
            throw new Error(`Invalid move: ${pgn}`);
        }
        const parentKey = (currentParent === null || currentParent === void 0 ? void 0 : currentParent.key) || null;
        const path = parentKey ? getPath(parentKey) : [];
        const data = Chess.nodeDataFromMove(currentGame, move, path.length + 1);
        data.comment = currentData.comment || null;
        data.annotations = currentData.annotations || [];
        const node = addNode(data, parentKey);
        if (!node)
            throw new Error("Something went wrong");
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
                const path = currentParent ? getPath(currentParent["key"]) : [];
                const prevParent = path[path.length - 2] || null;
                variationStack.push(currentParent);
                currentParent = prevParent;
                console.log(`variationstack: ${variationStack.map((node) => node && node.data.PGN)}`);
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
    if (currentData.pgn)
        postCurrentData();
    return buildTreeArray(map);
}
exports.pgnToTreeArray = pgnToTreeArray;

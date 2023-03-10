import * as Chess from "../../lib/chess";
import { v4 as uuidv4 } from "uuid";
import { TreeNode } from "../../hooks/useTreeData";
import { notEmpty } from "../misc";
//import fs from "fs";

//const sampleData = fs.readFileSync("./sample.pgn", "utf-8");

type ValueOf<T> = T[keyof T];
type Entries<T> = [keyof T, ValueOf<T>][];
import { Game } from "@/server/types/lobby";
const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;
const tagExpr = /^\[.* ".*"\]$/;
const bracketsExpr = /^\[(.+(?=\]$))\]$/;
const quoteDelimited = /"[^"]+"/g;
interface TagData {
  name: string;
  value: string;
}
function parseTag(tag: string): TagData | undefined {
  const string = tag.replace(bracketsExpr, "$1");
  const result = string.match(quoteDelimited);
  if (!result) return undefined;
  const value = result[0].replace(/^"(.+(?="$))"$/, "$1");
  const name = string.trim().split(" ")[0];
  return {
    name,
    value,
  };
}
export function pgnToJson(pgn: string): { tagData: PGNTagData; movetext: string } {
  let tags: string[] = [];
  let section: "tags" | "movetext" = "tags";
  //Split PGN into tags/movetext sections
  const args = pgn.split(/(\r\n|\n|\r)/gm);
  let movetext = "";
  args.forEach((arg) => {
    if (section === "tags") {
      if (/(\r\n|\n|\r)/gm.test(arg)) {
      } else if (!/\S/.test(arg)) {
        section = "movetext";
      } else if (tagExpr.test(arg.trim())) {
        tags.push(arg.trim());
      } else throw new Error(`Syntax Error: Invalid pgn tag ${arg}`);
    } else if (section === "movetext") {
      if (/(\r\n|\n|\r)/gm.test(arg)) {
      } else {
        movetext += `${arg.trim()} `;
      }
    }
  });
  const parsedTags = tags.map((tag) => parseTag(tag)).filter(notEmpty);

  let tagData: PGNTagData = {};
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

export interface PGNTagData {
  white?: string;
  black?: string;
  eloWhite?: string;
  eloBlack?: string;
  titleWhite?: string;
  titleBlack?: string;
  site?: string;
  event?: string;
  round?: string;
  date?: string;
  timeControl?: string;
  result?: "*" | "1-0" | "0-1" | "1/2-1/2";
  opening?: string;
  variation?: string;
  subVariation?: string;
  eco?: string;
  setUp?: "0" | "1";
  fen?: string;
}

const tagsDict: Record<keyof PGNTagData, string> = {
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

function tagDataToPGNString(data: PGNTagData): string {
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
    if (value) tagsString += `[${keyString} "${value}"]\r\n`;
  });
  return tagsString;
}
//console.log(pgnToJson(sampleData));
function buildTreeArray<T>(map: Map<string, TreeNode<T>>, parentKey: string | null = null): TreeNode<T>[] {
  if (parentKey === null) {
    return Array.from(map.values()).filter((node) => !node.parentKey);
  }
  const parentNode = map.get(parentKey);
  if (!parentNode) {
    return Array.from(map.values()).filter((node) => !node.parentKey);
  }
  return parentNode.children;
}

type Node = TreeNode<Chess.NodeData>;

export function mainLineFromTreeArray(treeArray: Node[]) {
  const path: Node[] = [];
  let currentNode = treeArray[0];
  while (currentNode) {
    path.push(currentNode);
    currentNode = currentNode.children[0];
  }
  return path;
}

export function parsePgn(pgn: string) {
  const { tagData, movetext } = pgnToJson(pgn);
  const startPosition = tagData.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const tree = parseMoveText(movetext, startPosition);
  return {
    tree,
    tagData,
  };
}

export function mainLineToMoveHistory(line: Node[]) {}

/**
 * Parse standard PGN movetext into initial tree for analysis board
 * @param movetext Standard PGN movetext {@link http://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c8.2|- as defined here}
 * @param startPosition FEN string of the start position of the game
 * @returns move tree with parsed data as ``Node[]``
 */
export function parseMoveText(movetext: string, startPosition?: string): Node[] {
  let map = new Map<string, Node>();
  const addNode = (data: Chess.NodeData, parentKey: string | null): Node | undefined => {
    const key = uuidv4();
    const newNode = { key, data, parentKey: parentKey, children: [] };
    map.set(newNode.key, newNode);
    if (parentKey) {
      const parentNode = map.get(parentKey);
      if (!parentNode) throw new Error("Invalid parent key.");
      parentNode.children.push(newNode);
    }
    return newNode;
  };

  function getPath(key: string): Node[] {
    const destNode = map.get(key);
    if (!destNode) return [];
    let path: Node[] = [];
    let currentNode: Node | undefined = destNode;
    while (currentNode) {
      path.unshift(currentNode);
      if (currentNode.parentKey === null) break;
      const parentNode = map.get(currentNode.parentKey);
      currentNode = parentNode;
    }
    return path;
  }

  let stream = movetext.replace(/(\r\n|\n|\r)/gm, "").trim();
  var lastIndex = stream.lastIndexOf(" ");

  stream = stream.substring(0, lastIndex);
  console.log(stream);
  const initialGame = Chess.createGame({ startPosition: startPosition });
  //let currentGame = initialGame;
  let reading = "unknown";
  let prevChar = " ";
  let currentData: { pgn?: string; comment: string | null; annotations: number[] } = {
    comment: null,
    annotations: [],
  };
  let currentMove = "";
  let moveCount = "1";
  let comment = "";
  let annotation = "";

  //Stack to maintian move to return to when closing a variation
  let variationStack: Array<Node | null> = [];
  let currentParent: Node | null = null;

  const isDigit = (char: string): boolean => {
    const exp = /\d/;
    return exp.test(char);
  };
  //Get the current game state as a game object based on the parent of the current node being parsed
  const getCurrentGame = () => {
    const node = currentParent;
    if (!node) return initialGame;
    else {
      const currentPath = getPath(node.key);
      return Chess.gameFromNodeData(
        node.data,
        initialGame.config.startPosition,
        currentPath.map((node) => node.data)
      );
    }
  };
  //Add the current node/data to the tree and reset values
  const postCurrentData = () => {
    const pgn = currentData.pgn;
    if (!pgn) throw new Error("Invalid PGN string");
    const currentGame = getCurrentGame();
    //Verify the move text is a valid/legal move
    const move = currentGame.legalMoves.find((move) => move.PGN === pgn);
    if (!move) {
      console.log(pgn);
      console.log(currentGame.legalMoves);
      throw new Error(`Invalid move: ${pgn}`);
    }
    const parentKey = currentParent?.key || null;
    const path = parentKey ? getPath(parentKey) : [];
    //Generate node data from game/move
    const data = Chess.nodeDataFromMove(currentGame, move, path.length + 1);
    data.comment = currentData.comment || null;
    data.annotations = currentData.annotations || [];
    const node = addNode(data, parentKey);
    if (!node) throw new Error("Something went wrong");
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
      } else {
        comment += char;
      }
    } else if (char === "{") {
      reading = "comment";
    } else if (char === "}" && reading !== "comment") {
      throw new Error("Invalid pgn");
    } else if (reading === "annotation") {
      if (char === " ") {
        if (!annotation.length) throw new Error("Invalid PGN; annotaion flag `$` not followed by valid NAG");
        if (currentData.annotations) {
          currentData.annotations.push(parseInt(annotation));
        } else {
          currentData.annotations = [parseInt(annotation)];
        }
        annotation = "";
        reading = "unknown";
      } else if (char === "(") {
        if (currentData.annotations) {
          currentData.annotations.push(parseInt(annotation));
        } else {
          currentData.annotations = [parseInt(annotation)];
        }
        annotation = "";
        if (currentData.pgn) postCurrentData();
        //Start a new variation;
        const path: Node[] = currentParent ? getPath(currentParent["key"]) : [];
        const prevParent = path[path.length - 2] || null;
        variationStack.push(currentParent);
        currentParent = prevParent;
        reading = "unknown";
      } else if (char === ")") {
        if (currentData.annotations) {
          currentData.annotations.push(parseInt(annotation));
        } else {
          currentData.annotations = [parseInt(annotation)];
        }
        annotation = "";
        if (currentData.pgn) postCurrentData();
        //Close variation; pop last node off the variation stack and set to current parent
        const nextParent = variationStack.pop();
        currentParent = nextParent || null;
        reading = "unknown";
      } else if (!isDigit(char)) {
        console.log(`Character:"${char}"`);
        throw new Error("Invalid NAG annotation code");
      } else {
        annotation += char;
      }
    } else if (char === "$") {
      reading = "annotation";
    } else if ((prevChar === " " || prevChar === ")" || prevChar === "}" || prevChar === "(") && isDigit(char)) {
      reading = "move-count";
      moveCount = char;
      if (currentData.pgn) postCurrentData();
    } else if (char === "(") {
      if (currentData.pgn) postCurrentData();
      const path: Node[] = currentParent ? getPath(currentParent["key"]) : [];
      const prevParent = path[path.length - 2] || null;
      variationStack.push(currentParent);
      currentParent = prevParent;
      console.log(`variationstack: ${variationStack.map((node) => node && node.data.PGN)}`);
    } else if (char === ")") {
      if (currentData.pgn) postCurrentData();
      const nextParent = variationStack.pop();
      currentParent = nextParent || null;
    } else if (reading === "move-count") {
      if (isDigit(char)) moveCount += char;
      else if (char === " ") reading = "pgn";
      else if (char !== ".") {
        currentMove = char;
        reading = "pgn";
      }
    } else if (reading === "pgn") {
      if (char === " " && currentMove.length) {
        reading = "unknown";
        currentData.pgn = currentMove;
        currentMove = "";
      } else if (char === " ") {
        reading = "unknown";
      } else currentMove += char;
    } else if (reading === "unknown") {
      const specialChars = [" ", "$", "(", ")", "{", "}"];
      if (!isDigit(char) && !specialChars.includes(char)) {
        if (currentData.pgn) postCurrentData();
        reading = "pgn";
        currentMove = char;
      }
    }
    prevChar = char;
  }
  //Add last node if not already in tree
  if (currentData.pgn) postCurrentData();
  //Recursively build map into tree array
  return buildTreeArray(map);
}

export function encodeGameToPgn(game: Game): string {
  const { w, b } = game.players;
  let tagData: PGNTagData = {
    white: w.username || undefined,
    black: b.username || undefined,
    eloWhite: `${w.rating}` || undefined,
    eloBlack: `${b.rating}` || undefined,
    event: "NextChess Online Game",
    result: encodeOutcome(game.data.outcome),
  };
  const tagSection = tagDataToPGNString(tagData);
  const movetext = moveHistoryToMoveText(game.data.moveHistory) + ` ${encodeOutcome(game.data.outcome)}`;
  return tagSection + "\r\n" + movetext;
}

export function moveHistoryToMoveText(moveHistory: Chess.MoveHistory) {
  let moveText = "";
  moveHistory.forEach((fullmove, idx) => {
    moveText += `${idx + 1}. ${fullmove[0].PGN} ${fullmove[1]?.PGN || ""}`;
  });
}

function encodeOutcome(outcome: Chess.Outcome) {
  if (!outcome) return "*";
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

import * as Chess from "../../lib/chess";
import { v4 as uuidv4 } from "uuid";
import { TreeNode } from "../../hooks/useTreeData";
import { notEmpty } from "../misc";

const tagExpr = /^\[.* ".*"\]$/;
const bracketsExpr = /^\[(.+(?=\]$))\]$/;
const quoteDelimited = /"[^"]+"/g;
interface TagJSON {
  name: string;
  value: string;
}
function parseTag(tag: string): TagJSON | undefined {
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
export function pgnToJson(pgn: string): any {
  let tags: string[] = [];
  let section: "tags" | "movetext" = "tags";
  const args = pgn.split(/(\r\n|\n|\r)/gm);
  console.log(args);
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
  return {
    tags: parsedTags,
    movetext: movetext.trim(),
  };
}

interface PGNJson {
  event: string;
  site: string;
  date: string;
  round: string;
  black: string;
  white: string;
  result: "*" | "0-1" | "1-0" | "1/2-1/2";
  moveText: string;
}
interface NodeDataPartial {
  PGN: string;
  comment: string | null;
  moveCount: [number, 0 | 1];
}

interface MaybeNodeDataPartial {
  PGN: string | null;
  comment: string | null;
  moveCount: [number, 0 | 1];
}

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

export function mainLineToMoveHistory(line: Node[]) {
  
}

export function pgnToTreeArray(pgn: string, startPosition?: string): Node[] {
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

  let stream = pgn.replace(/(\r\n|\n|\r)/gm, "");
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
  let variationStack: Array<Node | null> = [];
  let currentParent: Node | null = null;
  const isDigit = (char: string): boolean => {
    const exp = /\d/;
    return exp.test(char);
  };
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
  const postCurrentData = () => {
    const pgn = currentData.pgn;
    if (!pgn) throw new Error("Invalid PGN string");

    const currentGame = getCurrentGame();
    const move = currentGame.legalMoves.find((move) => move.PGN === pgn);

    if (!move) {
      console.log(pgn);
      throw new Error(`Invalid move: ${pgn}`);
    }

    const parentKey = currentParent?.key || null;
    const path = parentKey ? getPath(parentKey) : [];
    const data = Chess.nodeDataFromMove(currentGame, move, path.length + 1);
    data.comment = currentData.comment || null;
    data.annotations = currentData.annotations || [];
    const node = addNode(data, parentKey);
    if (!node) throw new Error("Something went wrong");
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
        const path: Node[] = currentParent ? getPath(currentParent["key"]) : [];
        const prevParent = path[path.length - 2] || null;
        variationStack.push(currentParent);
        currentParent = prevParent;
        console.log(`variationstack: ${variationStack.map((node) => node && node.data.PGN)}`);
        reading = "unknown";
      } else if (char === ")") {
        if (currentData.annotations) {
          currentData.annotations.push(parseInt(annotation));
        } else {
          currentData.annotations = [parseInt(annotation)];
        }
        annotation = "";
        if (currentData.pgn) postCurrentData();
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
  if (currentData.pgn) postCurrentData();
  return buildTreeArray(map);
}

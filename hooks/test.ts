import * as Chess from "@/lib/chess";
import { v4 as uuidv4 } from "uuid";
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
import { TreeNode } from "./useTreeData";

const testString = `1. e4 d5 {comment} 2. f4 (2. Nc3 f6 3. g4 (3. Qe2) (3. h3 b6 {another comment} 4. Nxd5)) 2... g6 3. Nc3 b6
4. h4 (4. g4 h5 5. Rb1)`;

function parsePGN(pgn: string) {
  const tree: Map<string, TreeNode<NodeDataPartial>> = new Map();

  function addNode(
    node: Omit<TreeNode<NodeDataPartial>, "parentKey">,
    parentKey: string | null
  ): void {
    console.log(node);
    console.log(parentKey);
    const newNode = { ...node, parentKey: parentKey };
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
    key: uuidv4(),
    data: { PGN: null, comment: null, moveCount: [1, 0] as [number, 0 | 1] },
    children: [],
  });
  let currentNode: Omit<TreeNode<MaybeNodeDataPartial>, "parentKey"> | null;
  let currentMove = "";
  let prevNode: TreeNode<NodeDataPartial> | null = null;
  let inComment = false;
  let comment = "";
  let stackTrace: string[] = [];
  let prevChar = " ";
  let count = "";
  let moveCounter = [1, 0];
  let inMoveCount = false;
  currentNode = newNode();

  const isDigit = (char: string): boolean => {
    const exp = /\d/;
    return exp.test(char);
  };

  for (const char of pgn) {
    if (inComment) {
      if (char === "}") {
        inComment = false;
        prevChar = char;
        if (!currentNode) throw new Error("Invalid pgn");
        currentNode.data.comment = comment;
      }
      comment += char;
    } else if (char === "{") {
      inComment = true;
    } else if (char === "}" && !inComment) {
      throw new Error("Invalid pgn");
    } else {
      if (
        (prevChar === " " ||
          prevChar === ")" ||
          prevChar === "}" ||
          prevChar === "(") &&
        isDigit(char)
      ) {
        if (inMoveCount) throw new Error("Invalid pgn");
        inMoveCount = true;
        count += char;
        if (currentNode.data.PGN) {
          const node = currentNode as unknown as Omit<
            TreeNode<MaybeNodeDataPartial>,
            "parentKey"
          > | null;
          if (!node || !node.data.PGN) throw new Error("Invalid pgn");
          addNode(
            node as Omit<TreeNode<NodeDataPartial>, "parentKey">,
            stackTrace[stackTrace.length - 1] || null
          );
          prevNode = {
            ...node,
            parentKey: stackTrace[stackTrace.length - 1] || null,
          } as TreeNode<NodeDataPartial>;
          currentNode = newNode();
          currentMove = "";
        } else {
          currentNode = newNode();
          currentMove = "";
        }
      } else if (inMoveCount) {
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
      } else if (char === "(") {
        if (prevNode) {
          stackTrace.push(prevNode.key);
        }
        if (currentNode.data.PGN) {
          addNode(
            currentNode as Omit<TreeNode<NodeDataPartial>, "parentKey">,
            stackTrace[stackTrace.length - 1] || null
          );
          prevNode = {
            ...currentNode,
            parentKey: stackTrace[stackTrace.length - 1] || null,
          } as TreeNode<NodeDataPartial>;
          currentNode = newNode();
          currentMove = "";
        }
      } else if (char === ")") {
        if (!currentNode) throw new Error("Invalid pgn");
        if (!currentNode.data.PGN) {
          stackTrace.pop();
        } else {
          addNode(
            currentNode as Omit<TreeNode<NodeDataPartial>, "parentKey">,
            stackTrace[stackTrace.length - 1] || null
          );
          prevNode = {
            ...currentNode,
            parentKey: stackTrace[stackTrace.length - 1] || null,
          } as TreeNode<NodeDataPartial>;
          stackTrace.pop();
          currentNode = newNode();
          currentMove = "";
        }
      } else if (char === " ") {
        if (!currentNode) throw new Error("Invalid pgn");
        if (currentMove.length) {
          currentNode.data.PGN = currentMove;
        }
        currentMove = "";
      } else {
        if (currentNode.data.PGN && prevChar === " ") {
          addNode(
            currentNode as Omit<TreeNode<NodeDataPartial>, "parentKey">,
            stackTrace[stackTrace.length - 1] || null
          );
          prevNode = {
            ...currentNode,
            parentKey: stackTrace[stackTrace.length - 1] || null,
          } as TreeNode<NodeDataPartial>;
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

function buildTreeArray<T>(
  map: Map<string, TreeNode<T>>,
  parentKey: string | null = null
): TreeNode<T>[] {
  if (parentKey === null) {
    return Array.from(map.values()).filter((node) => !node.parentKey);
  }
  const parentNode = map.get(parentKey);
  if (!parentNode) {
    return Array.from(map.values()).filter((node) => !node.parentKey);
  }
  return parentNode.children;
}

console.log(
  JSON.stringify(
    buildTreeArray(parsePGN(testString.replace(/(\r\n|\n|\r)/gm, ""))),
    null,
    2
  )
);

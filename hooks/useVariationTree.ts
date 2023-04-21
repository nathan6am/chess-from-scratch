import useTreeData, { TreeHook, TreeNode } from "./useTreeData";
import { useState, useMemo, useCallback } from "react";
import * as Chess from "@/lib/chess";
import { encodeCommentFromNodeData } from "@/util/parsers/pgnParser";
export interface VariationTree<T extends Chess.NodeData = Chess.NodeData> {
  tree: TreeHook<T>;
  loadNewTree: (tree: TreeNode<T>[]) => void;
  moveText: string;
  moveTextRaw: string;
  mainLine: TreeNode<T>[];
  rootNodes: TreeNode<T>[];
  findNextMove: (uci: string) => string | undefined;
  addMove: (data: T) => void;
  path: TreeNode<T>[];
  continuation: TreeNode<T>[];
  currentNode: TreeNode<T> | null;
  setCurrentKey: React.Dispatch<React.SetStateAction<string | null>>;
  currentKey: string | null;
  promoteToMainline: (key: string) => void;
  promoteVariation: (key: string) => void;
  deleteVariation: (key: string) => void;
  stepBackward: () => TreeNode<T> | null;
  stepForward: () => TreeNode<T> | null;
  treeArray: TreeNode<T>[];
}

export default function useVariationTree<T extends Chess.NodeData = Chess.NodeData>(
  initialTree?: TreeNode<T>[]
): VariationTree<T> {
  const tree = useTreeData<T>(initialTree || []);
  //Key of the selectedNode
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  function loadNewTree(newTree: TreeNode<T>[]) {
    setCurrentKey(null);
    tree.loadTree(newTree);
  }
  const currentNode = currentKey ? tree.getNode(currentKey) || null : null;

  const moveText = useMemo(() => {
    return treeArrayToMoveText(tree.treeArray);
  }, [tree]);

  const moveTextRaw = useMemo(() => {
    return treeArrayToMoveText(tree.treeArray, false);
  }, [tree]);

  const mainLine = useMemo<TreeNode<T>[]>(() => {
    const root = tree.treeArray[0];
    let path: TreeNode<T>[] = [];
    let currentNode = root;
    while (currentNode) {
      path.push(currentNode);
      currentNode = currentNode.children[0];
    }
    return path;
  }, [tree]);

  const rootNodes = useMemo(() => {
    return tree.treeArray;
  }, [tree.treeArray]);

  function treeArrayToMoveText(treeArray: TreeNode<T>[], annotate: boolean = true) {
    let movetext = "";
    let stack: TreeNode<T>[] = [];
    let previousVariationDepth = 0;
    // for (let i = treeArray.length - 1; i > 0; i--) {
    //   stack.push(treeArray[i]);
    // }
    stack.push(treeArray[0]);

    while (stack.length) {
      const node = stack.pop();
      if (!node) break;
      const halfMoveCount = tree.getDepth(node.key);
      const variationDepth = tree.getPly(node.key);
      const depthChange = variationDepth - previousVariationDepth;
      const index = tree.getSiblingIndex(node.key);
      const siblings = tree.getSiblings(node.key).slice(1);
      if (depthChange > 1) throw new Error("Invalid tree structure");
      if (depthChange < 0) {
        for (let i = -1; i > depthChange; i--) {
          movetext += ")";
        }
        movetext += " ";
      }
      if (index !== 0) movetext += "(";
      const isWhite = halfMoveCount % 2 == 0;
      if (depthChange !== 0 || index !== 0 || isWhite) {
        movetext += `${Math.floor(halfMoveCount / 2) + 1}${isWhite ? ". " : "... "}`;
      }
      movetext += `${node.data.PGN} ${
        node.data.annotations.length && annotate
          ? node.data.annotations.map((annotation) => `$${annotation}`).join(" ")
          : ""
      } ${annotate ? encodeCommentFromNodeData(node.data) : node.data.comment || ""}`;
      if (!node.children[0] && (index !== 0 || siblings.length === 0) && variationDepth !== 0) movetext += ")";
      if (node.children[0]) {
        stack.push(node.children[0]);
      }
      if (index === 0) {
        if (siblings.length) {
          for (let i = siblings.length - 1; i >= 0; i--) {
            stack.push(siblings[i]);
          }
        }
      }

      previousVariationDepth = variationDepth;
    }
    if (previousVariationDepth !== 0) {
      for (let i = 1; i < previousVariationDepth; i++) {
        movetext += ")";
      }
    }

    return movetext;
  }
  // Current line up to the current node
  const path = useMemo<TreeNode<T>[]>(() => {
    if (currentKey === null) return [];
    const path = tree.getPath(currentKey);
    return path || [];
  }, [currentKey, tree]);

  //Continuation of the current line after the selected node
  const continuation = useMemo<TreeNode<T>[]>(() => {
    const path = tree.getContinuation(currentKey);
    return path;
  }, [currentKey, tree]);

  const promoteVariation = useCallback<(key: string) => void>(
    (key: string) => {
      const node = tree.getNode(key);
      if (!node) return;
      const index = tree.getSiblingIndex(key);
      if (index === 0) {
        const variationStart = tree.findFirstAncestor(key, (node) => tree.getSiblingIndex(node.key) !== 0);
        if (!variationStart) return;
        tree.setSiblingIndex(variationStart.key, tree.getSiblingIndex(variationStart.key) - 1);
      } else {
        tree.setSiblingIndex(key, index - 1);
      }
    },
    [tree]
  );

  const promoteToMainline = useCallback<(key: string) => void>(
    (key: string) => {
      const node = tree.getNode(key);
      if (!node) return;
      const pathReversed = tree.getPath(key).reverse();
      pathReversed.forEach((node) => {
        tree.setSiblingIndex(node.key, 0);
      });
    },
    [tree]
  );

  //Find the key of a given next move if the variation already exists, otherwise returns undefined
  const findNextMove = useCallback<(uci: string) => string | undefined>(
    (uci: string) => {
      const nextMove = tree.findChild(currentKey, (node) => node.data.uci === uci);
      if (!nextMove) return undefined;
      return nextMove.key;
    },
    [currentKey, tree]
  );

  //Delete variation from current node
  function deleteVariation(key: string) {
    const node = tree.getNode(key);
    if (!node) return;
    const continuation = tree.getContinuation(key).map((node) => node.key);
    if (currentKey && (continuation.includes(currentKey) || key === currentKey)) {
      const parentKey = node.parentKey;
      setCurrentKey(parentKey);
    }
    tree.deleteNode(key);
  }

  //Insert a move after the move or create a variation if the move is not a last child
  function addMove(data: T) {
    //Check if the move already exists in the tree
    const moveKey = findNextMove(data.uci);
    if (moveKey) {
      setCurrentKey(moveKey);
      return;
    }
    const newNode = tree.addNode(data, currentKey);

    if (newNode)
      //Set the selected node to the new node
      setCurrentKey(newNode.key);
  }

  //Step forward on the current line
  function stepForward(): TreeNode<T> | null {
    if (continuation.length) {
      const next = continuation[0];
      setCurrentKey(next.key);
      return next;
    }
    return null;
  }

  function stepBackward(): TreeNode<T> | null {
    if (path.length > 1) {
      const prev = path[path.length - 2];
      setCurrentKey(prev.key);
      return prev;
    }
    setCurrentKey(null);
    return null;
  }

  return {
    tree,
    loadNewTree,
    moveText,
    moveTextRaw,
    mainLine,
    rootNodes,
    findNextMove,
    addMove,
    path,
    continuation,
    currentNode,
    setCurrentKey,
    currentKey,
    promoteToMainline,
    promoteVariation,
    deleteVariation,
    stepBackward,
    stepForward,
    treeArray: tree.treeArray,
  };
}

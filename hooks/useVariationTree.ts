import useTreeData, { TreeNode } from "./useTreeData";
import { useState, useMemo, useCallback } from "react";
import * as Chess from "@/lib/chess";
import { v4 as uuidv4 } from "uuid";
import nodeTest from "node:test";
import { gameFromNodeData, nodeDataFromMove } from "@/lib/chess";

interface VariationTree {}
export default function useVariationTree<T extends Chess.NodeData = Chess.NodeData>(initialTree?: TreeNode<T>[]) {
  const tree = useTreeData<T>(initialTree || []);
  const map = tree.map;
  //Key of the selectedNode
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  const currentNode = useMemo<TreeNode<T> | null>(() => {
    if (currentKey == null) return null;
    const node = tree.getNode(currentKey);
    if (!node) return null;
    return node;
  }, [currentKey, tree]);

  const moveText = useMemo(() => {
    return treeArrayToMoveText(tree.treeArray);
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

  const rootNodes = useMemo<TreeNode<T>[]>(() => {
    const root = tree.treeArray[0];
    if (!root) return [];
    const nodes = tree.getSiblings(root.key);
    return nodes;
  }, [tree]);

  function treeArrayToMoveText(treeArray: TreeNode<T>[]) {
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
        node.data.annotations.length ? node.data.annotations.map((annotation) => `$${annotation}`).join(" ") : ""
      } ${node.data.comment ? `{${node.data.comment}} ` : ""}`;
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

  //Find the key of a given next move if the variation already exists, otherwise returns undefined
  const findNextMove = useCallback<(uci: string) => string | undefined>(
    (uci: string) => {
      const nextMove = tree.findChild(currentKey, (node) => node.data.uci === uci);
      if (!nextMove) return undefined;
      return nextMove.key;
    },
    [currentKey, tree]
  );

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
    moveText,
    mainLine,
    rootNodes,
    findNextMove,
    addMove,
    path,
    continuation,
    currentNode,
    setCurrentKey,
    currentKey,
    stepBackward,
    stepForward,
    treeArray: tree.treeArray,
  };
}

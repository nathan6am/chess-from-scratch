import useTreeData, { TreeNode } from "./useTreeData";
import { useState, useMemo, useCallback } from "react";
import * as Chess from "@/lib/chess";
import { v4 as uuidv4 } from "uuid";
import nodeTest from "node:test";

interface VariationTree {}
export default function useVariationTree(initialTree?: TreeNode<Chess.NodeData>[]) {
  const tree = useTreeData<Chess.NodeData>(initialTree || []);
  const map = tree.map;
  //Key of the selectedNode
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  const currentNodeData = useMemo<Chess.NodeData | null>(() => {
    if (currentKey == null) return null;
    const node = tree.getNode(currentKey);
    if (!node) return null;
    return node.data;
  }, [currentKey, tree]);

  const pgn = useMemo(() => {
    return treeArrayToPgn(tree.treeArray);
  }, [tree]);

  const mainLine = useMemo<TreeNode<Chess.NodeData>[]>(() => {
    const root = tree.treeArray[0];
    let path: TreeNode<Chess.NodeData>[] = [];
    let currentNode = root;
    while (currentNode) {
      path.push(currentNode);
      currentNode = currentNode.children[0];
    }
    return path;
  }, [tree]);

  function treeArrayToPgn(treeArray: TreeNode<Chess.NodeData>[]) {
    let pgn = "";
    let stack: TreeNode<Chess.NodeData>[] = [];
    let previousVariationDepth = 0;
    for (let i = treeArray.length - 1; i > 0; i--) {
      stack.push(treeArray[i]);
    }
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
          pgn += ")";
        }
        pgn += " ";
      }
      if (index !== 0) pgn += "(";
      const isWhite = halfMoveCount % 2 == 0;
      if (depthChange !== 0 || index !== 0 || isWhite) {
        pgn += `${Math.floor(halfMoveCount / 2) + 1}${isWhite ? ". " : "... "}`;
      }
      pgn += `${node.data.PGN} ${
        node.data.comments.length ? `{${node.data.comments.join("; ")}} ` : ""
      }`;
      if (!node.children[0] && (index !== 0 || siblings.length === 0) && variationDepth !== 0)
        pgn += ")";
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
        pgn += ")";
      }
    }

    return pgn;
  }
  // Current line up to the current node
  const path = useMemo<TreeNode<Chess.NodeData>[]>(() => {
    if (currentKey === null) return [];
    const path = tree.getPath(currentKey);
    return path || [];
  }, [currentKey, tree]);

  //Continuation of the current line after the selected node
  const continuation = useMemo<TreeNode<Chess.NodeData>[]>(() => {
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
  function addMove(data: Chess.NodeData) {
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
  function stepForward(): TreeNode<Chess.NodeData> | null {
    if (continuation.length) {
      const next = continuation[0];
      setCurrentKey(next.key);
      return next;
    }
    return null;
  }

  function stepBackward(): TreeNode<Chess.NodeData> | null {
    if (path.length > 1) {
      const prev = path[path.length - 2];
      setCurrentKey(prev.key);
      return prev;
    }
    setCurrentKey(null);
    return null;
  }

  return {
    pgn,
    mainLine,
    findNextMove,
    addMove,
    path,
    continuation,
    currentNodeData,
    setCurrentKey: (key: string) => {
      setCurrentKey(key);
      return tree.getNode(key);
    },
    currentKey,
    onStepBackward: stepBackward,
    onStepForward: stepForward,
    treeArray: tree.treeArray,
  };
}

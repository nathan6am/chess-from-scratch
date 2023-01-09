import useTreeData, { TreeNode } from "./useTreeData";
import { useState, useMemo, useCallback } from "react";
import * as Chess from "@/util/chess";
import { v4 as uuidv4 } from "uuid";

export default function useVariationTree(
  initialTree?: TreeNode<Chess.NodeData>[]
) {
  const tree = useTreeData<Chess.NodeData>(initialTree || []);

  //Key of the selectedNode
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  const currentNodeData = useMemo<Chess.NodeData | null>(() => {
    if (currentKey == null) return null;
    const node = tree.getNode(currentKey);
    if (!node) return null;
    return node.data;
  }, [currentKey, tree]);

  // Current line up to the current node
  const path = useMemo<TreeNode<Chess.NodeData>[]>(() => {
    if (currentKey === null) return [];
    const path = tree.getPath(currentKey);
    return path || [];
  }, [currentKey, tree]);

  //Continuation of the current line after the selected node
  const continuation = useMemo<TreeNode<Chess.NodeData>[]>(() => {
    if (currentKey === null) return tree.treeArray;
    const siblings = tree.getSiblings(currentKey);
    if (siblings.length <= 1) return [];
    const index = siblings.findIndex((node) => node.key === currentKey);
    return siblings.slice(index + 1);
  }, [currentKey, tree]);

  //Find the key of a given next move if the variation already exists, otherwise returns undefined
  const findNextMove = useCallback<(uci: string) => string | undefined>(
    (uci: string) => {
      return tree.findNextNode(currentKey, (node) => node.data.uci === uci);
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
    const node = {
      key: uuidv4(),
      children: [],
      data,
    };
    tree.insertAfter(node, currentKey);
    //Set the selected node to the new node
    setCurrentKey(node.key);
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
    findNextMove,
    addMove,
    path,
    continuation,
    currentNodeData,
    setCurrentKey,
    onStepBackward: stepBackward,
    onStepForward: stepForward,
    treeArray: tree.treeArray,
  };
}

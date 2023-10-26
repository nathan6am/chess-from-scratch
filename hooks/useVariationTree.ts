import useTreeData, { TreeHook } from "./useTreeData";
import { TreeNode } from "@/lib/types";
import { useState, useMemo, useCallback } from "react";
import * as Chess from "@/lib/chess";
import { encodeCommentFromNodeData } from "@/util/parsers/pgnParser";
import { start } from "repl";
import { render } from "react-dom";
interface Options {
  annotate?: boolean;
  includeComments?: boolean;
  includeVariations?: boolean;
  includeNags?: boolean;
  includeTimeRemaining?: boolean;
  includeArrows?: boolean;
  initialMoveCount: number;
}
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
  deleteVariations: (key: string) => void;
  stepBackward: () => TreeNode<T> | null;
  stepForward: () => TreeNode<T> | null;
  treeArray: TreeNode<T>[];
  exportMoveText: (options: Options) => string;
}

export interface VariationTreeOptions<T> {
  initialTree?: TreeNode<T>[];
  initialMoveCount?: number;
  allowRootVariations?: boolean;
}
const defaultTreeOptions = {
  initialMoveCount: 0,
  allowRootVariations: true,
  initialTree: [],
};

// Serialize the tree map to a JSON-compatible object
function serializeTreeMap<T>(treeMap: Map<string, TreeNode<T>>): string {
  const serializedMap: any = {};

  for (const [key, value] of treeMap.entries()) {
    serializedMap[key] = {
      // Serialize other properties of your nodes as needed
      data: value.data,
      parentKey: value.parentKey,
      children: value.children.map((child) => child.key), // Store only the keys of child nodes
    };
  }

  return JSON.stringify(serializedMap);
}
// Deserialize the JSON object back to a tree map
function deserializeTreeMap<T>(json: string): Map<string, TreeNode<T>> {
  const serializedMap = JSON.parse(json);
  const treeMap = new Map();
  const pendingConnections = [];

  // Step 1: Deserialization without establishing parent-child relationships
  for (const [key, _value] of Object.entries(serializedMap)) {
    const value = _value as {
      data: T;
      parentKey: string;
      children: string[];
    };
    const node = {
      data: value.data,
      parentKey: value.parentKey,
      children: [], // Initialize children as an empty array
    };

    treeMap.set(key, node);

    // Store pending connections for the second step
    pendingConnections.push({ parentKey: key, children: value.children });
  }

  // Step 2: Establishing parent-child relationships with preserved order
  for (const connection of pendingConnections) {
    const { parentKey, children } = connection;
    const parentNode = treeMap.get(parentKey);

    for (const childKey of children) {
      const childNode = treeMap.get(childKey);
      if (parentNode && childNode) {
        parentNode.children.push(childNode);
      }
    }
  }

  return treeMap;
}

export default function useVariationTree<T extends Chess.NodeData = Chess.NodeData>(
  options: Partial<VariationTreeOptions<T>> = defaultTreeOptions
): VariationTree<T> {
  const { initialTree, initialMoveCount, allowRootVariations } = {
    ...defaultTreeOptions,
    ...options,
  };
  const tree = useTreeData<T>(initialTree || []);

  const treeMap = tree.map;
  const takeSnapShot = () => serializeTreeMap(treeMap);
  const loadSnapShot = (snapShot: string) => {
    tree.loadTree(deserializeTreeMap(snapShot));
  };
  //Key of the selectedNode
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  function loadNewTree(newTree: TreeNode<T>[]) {
    setCurrentKey(null);
    tree.loadTree(newTree);
  }
  const currentNode = currentKey ? tree.getNode(currentKey) || null : null;

  const moveText = useMemo(() => {
    return treeArrayToMoveText(tree.treeArray, { initialMoveCount, annotate: true });
  }, [tree]);

  const moveTextRaw = useMemo(() => {
    return treeArrayToMoveText(tree.treeArray, { annotate: false, initialMoveCount });
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

  function treeArrayToMoveText(treeArray: TreeNode<T>[], options: Partial<Options>): string {
    const defaultOptions: Options = {
      annotate: true,
      includeComments: true,
      includeVariations: true,
      includeNags: true,
      includeTimeRemaining: true,
      includeArrows: true,
      initialMoveCount: 0,
    };
    const {
      annotate,
      includeComments,
      includeNags,
      includeTimeRemaining,
      includeArrows,
      initialMoveCount,
      includeVariations,
    } = {
      ...defaultOptions,
      ...options,
    };
    let text = "";
    let stack: TreeNode<T>[] = [];
    let variationStartStack: TreeNode<T>[] = [];
    let previousVariationDepth = 0;
    let isFirstMove = true;
    var parenthesisCount = 0;
    stack.push(treeArray[0]);

    while (stack.length) {
      const node = stack.pop();

      if (!node) break;

      const halfMoveCount = tree.getDepth(node.key) + initialMoveCount;
      const variationDepth = tree.getPly(node.key);
      const depthChange = variationDepth - previousVariationDepth;

      const index = tree.getSiblingIndex(node.key);
      const siblings = tree.getSiblings(node.key).slice(1);

      const isVariationStart = index !== 0;
      const path = tree.getPath(node.key);
      //Remove nodes from the variationStartStack that are not in the current path
      const ancestorsLost = variationStartStack.filter((node) => !path.some((pathnode) => pathnode.key === node.key));
      if (ancestorsLost?.length) {
        for (let i = 0; i < ancestorsLost.length; i++) {
          text += ")";
          parenthesisCount--;
        }
        text += " ";
      }
      variationStartStack = variationStartStack.filter((node) => path.some((pathnode) => pathnode.key === node.key));
      if (isVariationStart) {
        variationStartStack.push(node);
      }

      if (index !== 0) {
        text += "(";
        parenthesisCount++;
      }
      const isWhite = halfMoveCount % 2 == 0;
      if (depthChange !== 0 || index !== 0 || isWhite || isFirstMove) {
        isFirstMove = false;
        text += `${Math.floor(halfMoveCount / 2) + 1}${isWhite ? ". " : "... "}`;
      }
      text += `${node.data.PGN} ${
        node.data.annotations.length && annotate && includeNags
          ? node.data.annotations.map((annotation) => `$${annotation}`).join(" ")
          : ""
      } ${
        annotate
          ? encodeCommentFromNodeData(node.data, { includeArrows, includeComments, includeTimeRemaining })
          : includeComments && node.data.comment
          ? `{${node.data.comment}} `
          : ""
      }`;
      // if (!node.children[0] && (index !== 0 || siblings.length === 0) && variationDepth !== 0) text += ")";
      if (node.children[0]) {
        stack.push(node.children[0]);
      }
      if (index === 0) {
        if (siblings.length && includeVariations) {
          for (let i = siblings.length - 1; i >= 0; i--) {
            stack.push(siblings[i]);
          }
        }
      }
    }
    if (previousVariationDepth !== 0) {
      for (let i = 1; i < previousVariationDepth; i++) {
        text += ")";
        parenthesisCount--;
      }
    }
    if (parenthesisCount !== 0) {
      for (let i = 0; i < parenthesisCount; i++) {
        text += ")";
      }
      text += " ";
    }
    return text;
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

  const deleteVariations = useCallback<(key: string) => void>(
    (key: string) => {
      const node = tree.getNode(key);
      if (!node) return;
      const variations = node.children.slice(1);
      variations.forEach((variation) => {
        tree.deleteNode(variation.key);
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
  function exportMoveText(options: Options) {
    return treeArrayToMoveText(tree.treeArray, options);
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
    deleteVariations,
    stepBackward,
    stepForward,
    treeArray: tree.treeArray,
    exportMoveText,
  };
}

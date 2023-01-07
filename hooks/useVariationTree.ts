import { useTreeData } from "react-stately/";
import * as Chess from "@/util/chess";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { TreeNode } from "@/util/chess";

const MAXDEPTH = 100;

//Hook to manage nested variation tree state for analysis board
export default function useVariationTree() {
  const tree = useTreeData<Chess.TreeNode>({
    initialItems: [],
    getChildren: (node) => node.children,
    getKey: (node) => node.id,
  });

  const prevNodeRef = useRef<string | null>(null);
  const [currentNode, setCurrentNode] = useState<null | Chess.TreeNode>(null);

  const pathToNode = useMemo<string[]>(() => {
    //Return if current node is unchanged
    if (currentNode === null) return [];
    const destNode = tree.getItem(currentNode.id);
    let node = destNode;
    if (!node) return [];
    let path: string[] = [node.key as string];
    let depth = 0;
    //Trace the path for the given node back to the root or maximum depth
    while (depth < MAXDEPTH) {
      const parentKey = node.parentKey;
      const parent = tree.getItem(parentKey);

      //Get all siblings before the specified node and prepend to the path
      const siblings = parentKey === null || !parent ? tree.items : parent.children;
      const nodeIdx = siblings.findIndex((siblingOrNode) => siblingOrNode.key === node.key);

      //Node does not exist on parent -- reset node to null and return empty line
      if (nodeIdx === -1) return [];

      if (nodeIdx > 0) {
        const siblingKeys = siblings.slice(0, nodeIdx).map((sibling) => sibling.key as string);
        path = [...siblingKeys, ...path];
      }

      if (parentKey === null || !parent) break;

      //Set the current node to the parent
      node = parent;

      //Increment depth to ensure no infinite looping
      depth++;
    }
    return path;
  }, [currentNode, tree]);

  //Current path as line
  const currentPathAsLine = useMemo(() => {
    return pathToNode.map((key) => tree.getItem(key).value);
  }, [pathToNode, tree]);
  //Array of all the nodes in the path to the current node
  const currentLine = useMemo(() => {
    let line = pathToNode;
    if (line.length > 0) {
      const node = tree.getItem(line[line.length - 1]);
      const parentKey = node.parentKey;
      const parent = tree.getItem(parentKey);

      //Append the rest of the line after the path to the node
      const siblings = parentKey === null || !parent ? tree.items : parent.children;
      const nodeIdx = siblings.findIndex((siblingOrNode) => siblingOrNode.key === node.key);
      if (nodeIdx < siblings.length - 1) {
        const postSiblings = siblings.slice(nodeIdx + 1).map((item) => item.key as string);
        line = [...line, ...postSiblings];
      }
    }
    return line.map((key) => tree.getItem(key).value);
  }, [tree, pathToNode]);

  //True if the current node is on the mainline
  //   const isMainLine = useMemo<boolean>(() => {
  //     if (currentNode === null) return true;
  //     return tree.getItem(currentNode.id).parentKey === null;
  //   }, [currentNode, tree]);

  //Step forward on the current line, resets node to null on error
  const stepForward = useCallback((): TreeNode | null => {
    if (currentNode === null) {
      setCurrentNode(tree.items[0].value);
      return tree.items[0].value || null;
    }
    console.log(currentLine);
    const currentIdx = currentLine.findIndex((item) => item.id === currentNode.id);
    if (currentIdx >= currentLine.length - 1) return currentNode;
    const nextKey = currentLine[currentIdx + 1].id;
    if (!nextKey) return currentNode;
    setCurrentNode(tree.getItem(nextKey).value);
    return tree.getItem(nextKey).value;
  }, [currentLine, currentNode, tree]);

  //Sets the current node to the previous in the line or null
  const stepBackward = useCallback((): TreeNode | null => {
    if (pathToNode.length <= 1) {
      setCurrentNode(null);
      return null;
    } else {
      const prevKey = pathToNode[pathToNode.length - 2];
      console.log(prevKey);
      setCurrentNode(tree.getItem(prevKey).value);
      return tree.getItem(prevKey).value || null;
    }
  }, [pathToNode, tree, currentNode]);

  const cacheEvaluation = useCallback(
    (evaluation: Chess.Evaluation) => {
      if (currentNode === null) return;
      tree.update(currentNode.id, { evaluation, ...currentNode });
    },
    [tree, currentNode]
  );

  //Returns the key of a move if a variation already exists, or undefined if it doesn't, given it's UCI notation
  const getNextMoveKey = useCallback(
    (uci: string): string | undefined => {
      //The node of the next move in curren variation; if none exists, the next move is
      //a continuation of the current variation and the nextMoveKey should be undefined
      if (tree.items.length === 0) return undefined;
      const nodeToSearch = (function () {
        if (currentNode === null) return tree.items[0];
        const node = tree.getItem(currentNode.id);
        const parent = tree.getItem(node.parentKey);
        const siblings = node.parentKey === null || !parent ? tree.items : parent.children;
        const nodeIdx = siblings.findIndex((siblingOrNode) => siblingOrNode.key === node.key);
        if (nodeIdx === siblings.length - 1) return null;
        return siblings[nodeIdx + 1];
      })();

      if (nodeToSearch === null) return undefined;
      if (nodeToSearch?.value?.uci === uci) return nodeToSearch.key as string;

      //Search down until a matching move is found, until there are no more children, or the max depth is reached

      let depth = 0;
      let node = nodeToSearch;
      while (depth < MAXDEPTH) {
        if (node.value.uci === uci) return node.key as string;

        //End of exisitng variations
        if (node.children.length <= 0) return undefined;

        //Set the node to the first child of the current node
        const next = node.children[0];
        if (!next) return undefined;
        node = next;
        depth++;
      }
    },
    [currentNode, tree, currentLine]
  );

  const insertNode = useCallback(
    (nodeToInsert: TreeNode) => {
      //Set current node and return if a variation already exists
      const nextMoveKey = getNextMoveKey(nodeToInsert.uci);
      if (nextMoveKey) {
        setCurrentNode(tree.getItem(nextMoveKey).value);
        return;
      }
      const { nodeIdx, isLastChild, siblings } = (function () {
        if (currentNode === null)
          return {
            isLastChild: tree.items.length === 0,
            siblings: tree.items,
            nodeIdx: -1,
          };
        const node = tree.getItem(currentNode.id);
        const parentKey = node.parentKey;
        const parent = tree.getItem(parentKey);
        const siblings = parentKey === null || !parent ? tree.items : parent.children;
        const nodeIdx = siblings.findIndex((siblingOrNode) => siblingOrNode.key === node.key);
        return {
          isLastChild: nodeIdx === siblings.length - 1,
          siblings,
          nodeIdx,
        };
      })();

      //Insert after the current node if it's the last child
      if (isLastChild) {
        if (currentNode === null) {
          tree.append(null, nodeToInsert);
          setCurrentNode(tree.getItem(nodeToInsert.id).value);
          return;
        }
        tree.insertAfter(currentNode.id, nodeToInsert);
        setCurrentNode(nodeToInsert);
        return;
      }
      console.log(isLastChild);

      //Otherwise, find the next node with no children
      const nodeToSearch = currentNode ? siblings[nodeIdx + 1] : tree.items[0];
      let insertKey: string | undefined;
      let depth = 0;
      let node = nodeToSearch;

      //Find the first child with no children, then create a new variation
      while (depth < MAXDEPTH) {
        if (node.children.length === 0) {
          insertKey = node.key as string;
          break;
        } else {
          node = node.children[0];
          depth++;
        }
      }
      if (!insertKey) throw new Error("Maximum depth exceeded");
      tree.append(insertKey, nodeToInsert);
      setCurrentNode(nodeToInsert);
    },
    [tree, currentNode, getNextMoveKey]
  );

  const jumpToNodeByKey = useCallback(
    (key: string) => {
      const node = tree.getItem(key);
      if (node && node.value) {
        setCurrentNode(node.value);
      }
    },
    [tree]
  );

  useEffect(() => {
    if (prevNodeRef.current === currentNode?.id || null) return;
    prevNodeRef.current = currentNode?.id || null;
  }, [currentNode]);
  return {
    insertNode,
    currentNode,
    currentLine,
    path: currentPathAsLine,
    getNextMoveKey,

    rootNodes: tree.items,
    jumpToNodeByKey,
    stepBackward,
    stepForward,
  };
}

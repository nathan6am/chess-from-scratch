import { useState, useMemo, useCallback } from "react";
export type TreeNode<T> = {
  key: string;
  data: T;
  children: TreeNode<T>[];
  parentKey: string | null;
};
import { v4 as uuidv4 } from "uuid";

export type TreeHook<T> = {
  map: Map<string, TreeNode<T>>;
  treeArray: TreeNode<T>[];
  getNode: (key: string) => TreeNode<T> | undefined;
  addNode: (data: T, parentKey: string | null, keygen?: () => string) => TreeNode<T> | undefined;
  updateNode: (key: string, data: Partial<T>) => void;
  deleteNode: (key: string) => void;
  getPath: (key: string) => TreeNode<T>[];
  getSiblings: (key: string) => TreeNode<T>[];
  getSiblingIndex: (key: string) => number;
  setSiblingIndex: (key: string, index: number) => void;
  getDepth: (key: string) => number;
  getPly: (key: string) => number;
  findChild: (
    key: string | null,
    callbackFn: (node: TreeNode<T>) => boolean
  ) => TreeNode<T> | undefined;
  findFirstAncestor: (
    key: string,
    callbackFn: (node: TreeNode<T>) => boolean
  ) => TreeNode<T> | undefined;
  getContinuation: (key: string | null) => TreeNode<T>[];
  loadTree: (treeData: Map<string, TreeNode<T>> | TreeNode<T>[]) => void;
  findNode?: (
    predicate: (node: TreeNode<T>) => boolean,
    traversalMethod?: string
  ) => TreeNode<T> | undefined;
};

function useTreeData<T extends object>(
  initialTree: Map<string, TreeNode<T>> | TreeNode<T>[] = new Map()
): TreeHook<T> {
  const [map, setMap] = useState<Map<string, TreeNode<T>>>(() =>
    initialTree instanceof Map ? initialTree : buildMapFromTreeArray(initialTree)
  );
  function loadTree(treeData: Map<string, TreeNode<T>> | TreeNode<T>[]) {
    const newMap = treeData instanceof Map ? treeData : buildMapFromTreeArray(treeData);
    setMap(newMap);
    setTreeArray(buildTreeArray(newMap));
  }
  const [treeArray, setTreeArray] = useState(buildTreeArray(map));

  function getNode(key: string): TreeNode<T> | undefined {
    return map.get(key);
  }

  /**
   * Insert a node into the tree
   * @param data The data for the node to add
   * @param parentKey The parent key for the node to insert
   * @param keygen An optional callback function to generate a key string for the node; if none is provided a new uuid will be generated
   * @returns The newly inserted node, or ``undefined`` if the parent key is invalid
   */
  function addNode(
    data: T,
    parentKey: string | null,
    keygen?: () => string
  ): TreeNode<T> | undefined {
    const key = keygen ? keygen() : uuidv4();
    const newNode = { key, data, parentKey: parentKey, children: [] };
    map.set(newNode.key, newNode);
    if (parentKey) {
      const parentNode = map.get(parentKey);
      if (!parentNode) throw new Error("Invalid parent key.");
      parentNode.children.push(newNode);
    }
    setTreeArray(buildTreeArray(map));
    return newNode;
  }

  /**
   * Update the data of a node given its key
   * @param key  The key of the node to update
   * @param data The updated data for the node(can be partial)
   */
  function updateNode(key: string, data: Partial<T>): void {
    const node = map.get(key);
    if (!node) {
      console.log(`Error: node with key ${key} not found`);
      return;
    }
    Object.assign(node.data, data);
    setTreeArray(buildTreeArray(map));
  }

  /**
   * Delete a node from the tree given its key
   * @param key The key of the node to delete
   */
  function deleteNode(key: string): void {
    const node = map.get(key);
    if (!node) {
      console.log(`Error: node with key ${key} not found`);
      return;
    }
    if (node.parentKey) {
      const parentNode = map.get(node.parentKey);
      if (!parentNode) {
        console.log(`Error: parent node with key ${node.parentKey} not found`);
        return;
      }
      parentNode.children = parentNode.children.filter((child) => child.key !== key);
    }
    map.delete(key);
    setTreeArray(buildTreeArray(map));
  }

  /**
   * Find a matching child of a node given its key and a callback function
   * @param key The key of the parent node
   * @param callbackFn A callback function for each child of the node; it takes the child node as an argument and should return a boolean
   * @returns The first child that satisfies the callback function or undefined
   */
  function findChild(
    key: string | null,
    callbackFn: (node: TreeNode<T>) => boolean
  ): TreeNode<T> | undefined {
    if (!key) {
      const rootNodes = Array.from(map.values()).filter((node) => !node.parentKey);
      return rootNodes.find((node) => callbackFn(node));
    }
    const node = getNode(key);
    if (!node) return undefined;
    if (!node.children.length) return undefined;
    const child = node.children.find((node) => callbackFn(node));
    return child;
  }

  /**
   *
   * @param node The node of which to search direct descendants
   * @param callbackFn A callback function for each direct descendatn of the node; it takes the node as an argument and should return a boolean
   * @returns The first child that satisfies the callback function or undefined
   */
  function findNextDescendant(
    node: TreeNode<T>,
    callbackFn: (node: TreeNode<T>) => boolean
  ): string | undefined {
    if (callbackFn(node)) {
      return node.key;
    } else if (node.children.length > 0) {
      return findNextDescendant(node.children[0], callbackFn);
    } else {
      return undefined;
    }
  }

  function findFirstAncestor(
    key: string,
    callbackFn: (node: TreeNode<T>) => boolean
  ): TreeNode<T> | undefined {
    const node = getNode(key);
    if (!node) return undefined;
    if (!node.parentKey) return undefined;
    let parentNode = getNode(node.parentKey);
    while (parentNode) {
      if (callbackFn(parentNode)) return parentNode;
      if (!parentNode.parentKey) return undefined;
      parentNode = getNode(parentNode.parentKey);
    }
  }

  function getPath(key: string): TreeNode<T>[] {
    const destNode = getNode(key);
    if (!destNode) return [];
    let path: TreeNode<T>[] = [];
    let currentNode: TreeNode<T> | undefined = destNode;
    while (currentNode) {
      path.unshift(currentNode);
      if (currentNode.parentKey === null) break;
      const parentNode = getNode(currentNode.parentKey);
      currentNode = parentNode;
    }
    return path;
  }

  function getDepth(key: string): number {
    const path = getPath(key);
    return path.length - 1;
  }

  function getPly(key: string): number {
    const path = getPath(key);
    let ply = 0;
    path.forEach((node) => {
      const index = getSiblingIndex(node.key);
      if (index > 0) ply++;
    });
    return ply;
  }
  function getContinuation(key: string | null): TreeNode<T>[] {
    const startNode = key
      ? getNode(key)
      : Array.from(map.values()).filter((node) => !node.parentKey)[0];
    let path: TreeNode<T>[] = [];
    let currentNode: TreeNode<T> | undefined = startNode;
    while (currentNode) {
      path.push(currentNode);
      if (!currentNode.children[0]) break;
      currentNode = currentNode.children[0];
    }
    if (!key) return path;
    return path.slice(1);
  }

  //Get the index of a node amongst it's siblings
  function getSiblingIndex(key: string): number {
    const node = map.get(key);
    if (!node) {
      return -1;
    }
    if (node.parentKey === null) {
      const rootNodes = Array.from(map.values()).filter((node) => !node.parentKey);
      return rootNodes.indexOf(node);
    }
    const parentNode = map.get(node.parentKey);
    if (!parentNode) {
      return -1;
    }
    return parentNode.children.indexOf(node);
  }

  function setSiblingIndex(key: string, index: number): void {
    let targetIndex = index;
    const siblings = getSiblings(key);
    if (index > siblings.length - 1) targetIndex = siblings.length - 1;
    if (index < 0) targetIndex = siblings.length - 1 + index;
    if (targetIndex < 0) targetIndex = 0;
    const node = map.get(key);
    if (!node) {
      return;
    }
    if (node.parentKey === null) {
      const rootNodes = Array.from(map.values()).filter((node) => !node.parentKey);
      rootNodes.splice(targetIndex, 0, rootNodes.splice(rootNodes.indexOf(node), 1)[0]);
      rootNodes.forEach((node) => map.delete(node.key));
      rootNodes.forEach((node) => map.set(node.key, node));
      setTreeArray(buildTreeArray(map));
      return;
    }
    const parentNode = map.get(node.parentKey);
    if (!parentNode) {
      return;
    }
    parentNode.children.splice(
      targetIndex,
      0,
      parentNode.children.splice(parentNode.children.indexOf(node), 1)[0]
    );
    setTreeArray(buildTreeArray(map));
  }

  //Get the siblings of a node
  function getSiblings(key: string): TreeNode<T>[] {
    const node = map.get(key);
    if (!node) {
      return [];
    }
    if (node.parentKey === null) {
      const rootNodes = Array.from(map.values()).filter((node) => !node.parentKey);
      return rootNodes;
    }
    const parentNode = map.get(node.parentKey);
    if (!parentNode) {
      return [];
    }
    return parentNode.children;
  }

  return {
    map,
    treeArray,
    addNode,
    updateNode,
    deleteNode,
    getPath,
    getContinuation,
    getSiblingIndex,
    setSiblingIndex,
    getSiblings,
    getNode,
    getDepth,
    getPly,
    findChild,
    findFirstAncestor,
    loadTree,
  };
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

function buildMapFromTreeArray<T>(treeArray: TreeNode<T>[]): Map<string, TreeNode<T>> {
  const map = new Map<string, TreeNode<T>>();
  const buildMapRecursive = (array: TreeNode<T>[], parentKey: string | null): void => {
    array.forEach((node) => {
      map.set(node.key, node);
      node.parentKey = parentKey;
      buildMapRecursive(node.children, node.key);
    });
  };
  buildMapRecursive(treeArray, null);
  return map;
}

export default useTreeData;

function rebuildTree<T, U>(
  tree: TreeNode<T>[],
  callback: (node: TreeNode<T>, partiallyRebuiltTree: TreeNode<U>[]) => TreeNode<U>
): TreeNode<U>[] {
  const newTree: TreeNode<U>[] = [];
  tree.forEach((node) => {
    const newNode = callback(node, newTree);
    if (node.children.length) {
      newNode.children = rebuildTree(node.children, callback);
    }
    newTree.push(newNode);
  });
  return newTree;
}

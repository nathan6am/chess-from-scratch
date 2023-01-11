import { sign } from "crypto";
import { useState, useMemo, useCallback } from "react";
export type TreeNode<T> = {
  key: string;
  data: T;
  children: TreeNode<T>[];
  parentKey: string | null;
};

type TreeHook<T> = {
  map: Map<string, TreeNode<T>>;
  treeArray: TreeNode<T>[];
  getNode: (key: string) => TreeNode<T> | undefined;
  addNode: (node: Omit<TreeNode<T>, "parentKey">, parentKey: string | null) => void;
  updateNode: (key: string, data: Partial<T>) => void;
  deleteNode: (key: string) => void;
  getPath: (key: string) => TreeNode<T>[] | undefined;
  getSiblingIndex: (key: string) => number;
  getSiblings: (key: string) => TreeNode<T>[];
  insertAfter: (node: Omit<TreeNode<T>, "parentKey">, insertKey: string | null) => void;
  findNextNode: (key: string | null, cmp: (node: TreeNode<T>) => boolean) => string | undefined;
};

function useTreeData<T extends object>(initialMap: Map<string, TreeNode<T>> | TreeNode<T>[] = new Map()): TreeHook<T> {
  const map = useMemo(() => (initialMap instanceof Map ? initialMap : buildMapFromTreeArray(initialMap)), []);
  const [treeArray, setTreeArray] = useState(buildTreeArray(map));
  const rootNodes = useMemo(() => Array.from(map.values()).filter((node) => !node.parentKey), [map]);
  function getNode(key: string): TreeNode<T> | undefined {
    return map.get(key);
  }

  function addNode(node: Omit<TreeNode<T>, "parentKey">, parentKey: string | null): void {
    const newNode = { ...node, parentKey: parentKey };
    map.set(node.key, newNode);
    console.log(parentKey);
    if (parentKey) {
      const parentNode = map.get(parentKey);
      if (!parentNode) {
        console.log(`Error: parent node with key ${parentKey} not found`);
        return;
      }
      parentNode.children.push(newNode);
    }
    setTreeArray(buildTreeArray(map));
  }

  function updateNode(key: string, data: Partial<T>): void {
    const node = map.get(key);
    if (!node) {
      console.log(`Error: node with key ${key} not found`);
      return;
    }
    Object.assign(node.data, data);
    setTreeArray(buildTreeArray(map));
  }

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

  function deleteNodeAndSubsequentSiblings(key: string): void {
    const node = map.get(key);
    if (!node) {
      console.log(`Error: node with key ${key} not found`);
      return;
    }
    const parentNode = node.parentKey ? map.get(node.parentKey) : null;
    if (parentNode) {
      const i = parentNode.children.indexOf(node);
      parentNode.children.splice(i, parentNode.children.length - i);
    } else {
      const rootNodes = Array.from(map.values()).filter((node) => node.parentKey === null);
      const i = rootNodes.indexOf(node);
      rootNodes.splice(i, rootNodes.length - i).forEach((n) => map.delete(n.key));
    }
    setTreeArray(buildTreeArray(map));
  }

  function getPath(key: string): TreeNode<T>[] | undefined {
    const path: TreeNode<T>[] = [];
    let endNode = map.get(key);

    if (!endNode) return [];
    path.push(endNode);
    let currentNode = endNode;

    while (currentNode) {
      const parentKey = currentNode.parentKey;
      if (!parentKey) {
        const siblings = Array.from(map.values()).filter((node) => node.parentKey === null);
        const index = siblings.indexOf(currentNode);
        if (index > 0) {
          path.unshift(...siblings.slice(0, index));
        }
        return path;
      } else {
        const parentNode = map.get(parentKey);
        if (!parentNode) {
          console.log(`Error: node with key ${key} not found`);
          return [];
        }
        const siblings = parentNode.children;
        const index = siblings.indexOf(currentNode);
        if (index > 0) {
          path.unshift(...siblings.slice(0, index));
        }
        currentNode = parentNode;
      }
    }
    return path.length > 0 ? path : undefined;
  }

  function findNextNode(key: string | null, cmp: (node: TreeNode<T>) => boolean): string | undefined {
    if (key === null) {
      const rootNodes = Array.from(map.values()).filter((node) => !node.parentKey);
      if (rootNodes.length) {
        const sibling = rootNodes[0];
        if (cmp(sibling)) {
          return sibling.key;
        } else {
          return findNextDescendant(sibling, cmp);
        }
      } else {
        return undefined;
      }
    }
    const node = map.get(key);
    if (!node) return undefined;

    const parentKey = node.parentKey;
    if (parentKey) {
      const parentNode = map.get(parentKey);
      if (!parentNode) return undefined;
      const index = parentNode.children.indexOf(node);
      if (index < parentNode.children.length - 1) {
        const sibling = parentNode.children[index + 1];
        if (cmp(sibling)) {
          return sibling.key;
        } else {
          return findNextDescendant(sibling, cmp);
        }
      } else {
        return undefined;
      }
    } else {
      const rootNodes = Array.from(map.values()).filter((node) => !node.parentKey);
      const index = rootNodes.indexOf(node);
      if (index < rootNodes.length - 1) {
        const sibling = rootNodes[index + 1];
        if (cmp(sibling)) {
          return sibling.key;
        } else {
          return findNextDescendant(sibling, cmp);
        }
      } else {
        return undefined;
      }
    }
  }

  function findNextDescendant(node: TreeNode<T>, cmp: (node: TreeNode<T>) => boolean): string | undefined {
    if (cmp(node)) {
      return node.key;
    } else if (node.children.length > 0) {
      return findNextDescendant(node.children[0], cmp);
    } else {
      return undefined;
    }
  }

  /**Insert a node at the next index if the node of the given key if the node is a last child,
   * otherwise at the first leaf node of the first children of the next sibling
   * */
  function insertAfter(node: Omit<TreeNode<T>, "parentKey">, prevKey: string | null): void {
    const rootNodes = Array.from(map.values()).filter((node) => !node.parentKey);
    if (prevKey && !map.get(prevKey)) {
      console.log(`Error: node with key ${prevKey} not found`);
      return;
    }
    const siblings = prevKey ? getSiblings(prevKey) : rootNodes;

    if (prevKey === null) {
      const nextSibling = siblings[0];
      if (!nextSibling) {
        addNode(node, null);
        setTreeArray(buildTreeArray(map));
        return;
      }
      const insertKey = findNextDescendant(nextSibling, (descendant) => descendant.children.length === 0);
      addNode(node, insertKey || null);

      setTreeArray(buildTreeArray(map));
      return;
    }
    const prevNode = map.get(prevKey);
    if (!prevNode) {
      console.log(`Error: node with key ${prevKey} not found`);
      return;
    }
    const index = siblings.indexOf(prevNode);
    if (index < siblings.length - 1) {
      const nextSibling = siblings[index + 1];
      const insertKey = findNextDescendant(nextSibling, (descendant) => descendant.children.length === 0);
      addNode(node, insertKey || null);
      setTreeArray(buildTreeArray(map));
      return;
    } else {
      console.log("here");
      console.log(prevNode.parentKey);
      addNode(node, prevNode.parentKey);
      setTreeArray(buildTreeArray(map));
      return;
    }
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
    insertAfter,
    getPath,
    getSiblingIndex,
    getSiblings,
    getNode,
    findNextNode,
  };
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

// function rebuildTreeFromMap<T, U>(
//   map: Map<string, TreeNode<T>>,
//   callback: (node: TreeNode<T>, previousNode: TreeNode<U> | null, map: Map<string, TreeNode<U>>) => TreeNode<U>,
//   parentKey: string | null = null
// ): Map<string, TreeNode<U>> {
//   const newMap = new Map<string, TreeNode<U>>();
//   map.forEach((node, key) => {
//     let previousNode: TreeNode<U> | null = null;
//     if (parentKey) {
//       const parent = newMap.get(parentKey);
//       if (parent) {
//         const index = parent.children.findIndex((child) => child.key === key);
//         if (index > 0) {
//           previousNode = parent.children[index - 1];
//         } else if (parent.parentKey) {
//           const next = newMap.get(parent.parentKey);
//           if (!next) throw new Error(`Node with key:${parent.parentKey} does not exist`);
//           previousNode = next;
//           while (previousNode && previousNode.parentKey) {
//             const index = previousNode.children.findIndex((child) => child.key === parent.key);
//             if (index > 0) {
//               previousNode = previousNode.children[index - 1];
//               break;
//             }
//             const next = newMap.get(parent.parentKey);
//             if (!next) throw new Error(`Node with key:${parent.parentKey} does not exist`);
//             previousNode = next;
//           }
//         }
//       }
//     }
//     const newNode = callback(node, previousNode, newMap);
//     if (node.children.length) {
//       newNode.children = buildTreeArray(rebuildTreeFromMap(map, callback, key));
//     }
//     newMap.set(key, newNode);
//   });
//   return newMap;
// }

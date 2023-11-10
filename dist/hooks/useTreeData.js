"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const uuid_1 = require("uuid");
function useTreeData(initialTree = new Map()) {
    const [map, setMap] = (0, react_1.useState)(() => initialTree instanceof Map ? initialTree : buildMapFromTreeArray(initialTree));
    const [loading, setLoading] = (0, react_1.useState)(false);
    //The id of the loaded tree (for file saving/syncing)
    const [id, setId] = (0, react_1.useState)(null);
    const [treeArray, setTreeArray] = (0, react_1.useState)(buildTreeArray(map));
    function loadTree(treeData, treeId) {
        //set loading to true while the tree array is being updated (pre load)
        setLoading(true);
        //Build the map from the tree array and update state
        const newMap = treeData instanceof Map ? treeData : buildMapFromTreeArray(treeData);
        setMap(newMap);
        setTreeArray(buildTreeArray(newMap));
        setId(treeId || null);
    }
    (0, react_1.useEffect)(() => {
        //set loading to false once the tree array has been updated (post load)
        setLoading(false);
    }, [treeArray]);
    function getNode(key) {
        return map.get(key);
    }
    /**
     * Insert a node into the tree
     * @param data The data for the node to add
     * @param parentKey The parent key for the node to insert
     * @param keygen An optional callback function to generate a key string for the node; if none is provided a new uuid will be generated
     * @returns The newly inserted node, or ``undefined`` if the parent key is invalid
     */
    function addNode(data, parentKey, keygen) {
        //Block updates while loading
        if (loading)
            return;
        //Generate key and create new node
        const key = keygen ? keygen() : (0, uuid_1.v4)();
        const newNode = { key, data, parentKey: parentKey, children: [] };
        map.set(newNode.key, newNode);
        if (parentKey) {
            const parentNode = map.get(parentKey);
            if (!parentNode)
                throw new Error("Invalid parent key.");
            parentNode.children.push(newNode);
        }
        //Force update derived state (because React is stupid and the map is a reference type)
        setTreeArray(buildTreeArray(map));
        return newNode;
    }
    /**
     * Update the data of a node given its key
     * @param key  The key of the node to update
     * @param data The updated data for the node(can be partial)
     */
    function updateNode(key, data) {
        if (loading)
            return;
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
    function deleteNode(key) {
        if (loading)
            return;
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
    function findChild(key, callbackFn) {
        if (!key) {
            const rootNodes = Array.from(map.values()).filter((node) => !node.parentKey);
            return rootNodes.find((node) => callbackFn(node));
        }
        const node = getNode(key);
        if (!node)
            return undefined;
        if (!node.children.length)
            return undefined;
        const child = node.children.find((node) => callbackFn(node));
        return child;
    }
    /**
     *
     * @param node The node of which to search direct descendants
     * @param callbackFn A callback function for each direct descendatn of the node; it takes the node as an argument and should return a boolean
     * @returns The first child that satisfies the callback function or undefined
     */
    function findNextDescendant(node, callbackFn) {
        if (callbackFn(node)) {
            return node.key;
        }
        else if (node.children.length > 0) {
            return findNextDescendant(node.children[0], callbackFn);
        }
        else {
            return undefined;
        }
    }
    function findFirstAncestor(key, callbackFn) {
        const node = getNode(key);
        if (!node)
            return undefined;
        if (!node.parentKey)
            return undefined;
        let parentNode = getNode(node.parentKey);
        while (parentNode) {
            if (callbackFn(parentNode))
                return parentNode;
            if (!parentNode.parentKey)
                return undefined;
            parentNode = getNode(parentNode.parentKey);
        }
    }
    /**
     *
     * @param key The key of the node to find the path for
     * @returns An array of nodes representing the path from the root to the node
     */
    function getPath(key) {
        const destNode = getNode(key);
        if (!destNode)
            return [];
        let path = [];
        let currentNode = destNode;
        while (currentNode) {
            path.unshift(currentNode);
            if (currentNode.parentKey === null)
                break;
            const parentNode = getNode(currentNode.parentKey);
            currentNode = parentNode;
        }
        return path;
    }
    function getDepth(key) {
        const path = getPath(key);
        return path.length - 1;
    }
    /**
     *
     * @param key The key of the node to find the ply for
     * @returns The ply of the node
     */
    function getPly(key) {
        const path = getPath(key);
        let ply = 0;
        path.forEach((node) => {
            const index = getSiblingIndex(node.key);
            if (index > 0)
                ply++;
        });
        return ply;
    }
    /**
     *
     * @param key The key of the node to find the continuation for
     * @returns The continuation of first descendants of the given node
     */
    function getContinuation(key) {
        const startNode = key ? getNode(key) : Array.from(map.values()).filter((node) => !node.parentKey)[0];
        let path = [];
        let currentNode = startNode;
        while (currentNode) {
            path.push(currentNode);
            if (!currentNode.children[0])
                break;
            currentNode = currentNode.children[0];
        }
        if (!key)
            return path;
        return path.slice(1);
    }
    /**
     *
     * @param key The key of the node to find the sibling index for
     * @returns The index of the node among its siblings
     */
    function getSiblingIndex(key) {
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
    /**
     *
     * @param key The key of the node to set the sibling index for
     * @param index the index to set the node to
     */
    function setSiblingIndex(key, index) {
        let targetIndex = index;
        const siblings = getSiblings(key);
        if (index > siblings.length - 1)
            targetIndex = siblings.length - 1;
        if (index < 0)
            targetIndex = siblings.length - 1 + index;
        if (targetIndex < 0)
            targetIndex = 0;
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
        parentNode.children.splice(targetIndex, 0, parentNode.children.splice(parentNode.children.indexOf(node), 1)[0]);
        setTreeArray(buildTreeArray(map));
    }
    /**
     *
     * @param key The key of the node to find the siblings for
     * @returns the siblings of the node (including the node itself)
     */
    function getSiblings(key) {
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
        loading,
        id,
        setId,
    };
}
//Get the tree array from the map (filter out root nodes)
function buildTreeArray(map, parentKey = null) {
    if (parentKey === null) {
        return Array.from(map.values()).filter((node) => !node.parentKey);
    }
    const parentNode = map.get(parentKey);
    if (!parentNode) {
        return Array.from(map.values()).filter((node) => !node.parentKey);
    }
    return parentNode.children;
}
//Recursively build a map from an exisitin tree array
function buildMapFromTreeArray(treeArray) {
    const map = new Map();
    const buildMapRecursive = (array, parentKey) => {
        array.forEach((node) => {
            map.set(node.key, node);
            node.parentKey = parentKey;
            buildMapRecursive(node.children, node.key);
        });
    };
    buildMapRecursive(treeArray, null);
    return map;
}
exports.default = useTreeData;
function rebuildTree(tree, callback) {
    const newTree = [];
    tree.forEach((node) => {
        const newNode = callback(node, newTree);
        if (node.children.length) {
            newNode.children = rebuildTree(node.children, callback);
        }
        newTree.push(newNode);
    });
    return newTree;
}

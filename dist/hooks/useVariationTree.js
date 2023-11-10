"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const useTreeData_1 = __importDefault(require("./useTreeData"));
const react_1 = require("react");
const pgnParser_1 = require("@/util/parsers/pgnParser");
const defaultTreeOptions = {
    initialMoveCount: 0,
    allowRootVariations: true,
    initialTree: [],
};
// Serialize the tree map to a JSON-compatible object
function serializeTreeMap(treeMap) {
    const serializedMap = {};
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
function deserializeTreeMap(json) {
    const serializedMap = JSON.parse(json);
    const treeMap = new Map();
    const pendingConnections = [];
    // Step 1: Deserialization without establishing parent-child relationships
    for (const [key, _value] of Object.entries(serializedMap)) {
        const value = _value;
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
function useVariationTree(options = defaultTreeOptions) {
    const { initialTree, initialMoveCount, allowRootVariations } = {
        ...defaultTreeOptions,
        ...options,
    };
    const tree = (0, useTreeData_1.default)(initialTree || []);
    const treeArrayToMoveText = (0, react_1.useCallback)((treeArray, options) => {
        const defaultOptions = {
            annotate: true,
            includeComments: true,
            includeVariations: true,
            includeNags: true,
            includeTimeRemaining: true,
            includeArrows: true,
            initialMoveCount: 0,
        };
        const { annotate, includeComments, includeNags, includeTimeRemaining, includeArrows, initialMoveCount, includeVariations, } = {
            ...defaultOptions,
            ...options,
        };
        let text = "";
        let stack = [];
        let variationStartStack = [];
        let previousVariationDepth = 0;
        let isFirstMove = true;
        var parenthesisCount = 0;
        stack.push(treeArray[0]);
        while (stack.length) {
            const node = stack.pop();
            if (!node)
                break;
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
            text += `${node.data.PGN} ${node.data.annotations.length && annotate && includeNags
                ? node.data.annotations.map((annotation) => `$${annotation}`).join(" ")
                : ""} ${annotate
                ? (0, pgnParser_1.encodeCommentFromNodeData)(node.data, { includeArrows, includeComments, includeTimeRemaining })
                : includeComments && node.data.comment
                    ? `{${node.data.comment}} `
                    : ""}`;
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
    }, [tree, initialMoveCount]);
    //Key of the selectedNode
    const [currentKey, setCurrentKey] = (0, react_1.useState)(null);
    function loadNewTree(newTree, id) {
        setCurrentKey(null);
        tree.loadTree(newTree, id);
    }
    //Id of the loaded tree
    const treeId = (0, react_1.useMemo)(() => {
        if (tree.loading)
            return null;
        return tree.id;
    }, [tree.id, tree.loading]);
    const currentNode = currentKey ? tree.getNode(currentKey) || null : null;
    const moveText = (0, react_1.useMemo)(() => {
        return treeArrayToMoveText(tree.treeArray, { initialMoveCount, annotate: true });
    }, [tree.treeArray, treeArrayToMoveText, initialMoveCount]);
    const mainLine = (0, react_1.useMemo)(() => {
        const root = tree.treeArray[0];
        let path = [];
        let currentNode = root;
        while (currentNode) {
            path.push(currentNode);
            currentNode = currentNode.children[0];
        }
        return path;
    }, [tree.treeArray]);
    const rootNodes = (0, react_1.useMemo)(() => {
        return tree.treeArray;
    }, [tree.treeArray]);
    // Current line up to the current node
    const path = (0, react_1.useMemo)(() => {
        if (currentKey === null)
            return [];
        const path = tree.getPath(currentKey);
        return path || [];
    }, [currentKey, tree]);
    //Continuation of the current line after the selected node
    const continuation = (0, react_1.useMemo)(() => {
        const path = tree.getContinuation(currentKey);
        return path;
    }, [currentKey, tree]);
    const promoteVariation = (0, react_1.useCallback)((key) => {
        const node = tree.getNode(key);
        if (!node)
            return;
        const index = tree.getSiblingIndex(key);
        if (index === 0) {
            const variationStart = tree.findFirstAncestor(key, (node) => tree.getSiblingIndex(node.key) !== 0);
            if (!variationStart)
                return;
            tree.setSiblingIndex(variationStart.key, tree.getSiblingIndex(variationStart.key) - 1);
        }
        else {
            tree.setSiblingIndex(key, index - 1);
        }
    }, [tree]);
    const promoteToMainline = (0, react_1.useCallback)((key) => {
        const node = tree.getNode(key);
        if (!node)
            return;
        const pathReversed = tree.getPath(key).reverse();
        pathReversed.forEach((node) => {
            tree.setSiblingIndex(node.key, 0);
        });
    }, [tree]);
    const deleteVariations = (0, react_1.useCallback)((key) => {
        const node = tree.getNode(key);
        if (!node)
            return;
        const variations = node.children.slice(1);
        variations.forEach((variation) => {
            tree.deleteNode(variation.key);
        });
    }, [tree]);
    //Find the key of a given next move if the variation already exists, otherwise returns undefined
    const findNextMove = (0, react_1.useCallback)((uci) => {
        const nextMove = tree.findChild(currentKey, (node) => node.data.uci === uci);
        if (!nextMove)
            return undefined;
        return nextMove.key;
    }, [currentKey, tree]);
    //Delete variation from current node
    function deleteVariation(key) {
        const node = tree.getNode(key);
        if (!node)
            return;
        const continuation = tree.getContinuation(key).map((node) => node.key);
        if (currentKey && (continuation.includes(currentKey) || key === currentKey)) {
            const parentKey = node.parentKey;
            setCurrentKey(parentKey);
        }
        tree.deleteNode(key);
    }
    //Insert a move after the move or create a variation if the move is not a last child
    function addMove(data) {
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
    function stepForward() {
        if (continuation.length) {
            const next = continuation[0];
            setCurrentKey(next.key);
            return next;
        }
        return null;
    }
    function stepBackward() {
        if (path.length > 1) {
            const prev = path[path.length - 2];
            setCurrentKey(prev.key);
            return prev;
        }
        setCurrentKey(null);
        return null;
    }
    const exportMoveText = (0, react_1.useCallback)((options) => {
        return treeArrayToMoveText(tree.treeArray, options);
    }, [tree.treeArray]);
    return {
        tree,
        treeId,
        setTreeId: tree.setId,
        loadNewTree,
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
exports.default = useVariationTree;

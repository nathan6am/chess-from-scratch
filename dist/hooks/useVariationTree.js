"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const useTreeData_1 = __importDefault(require("./useTreeData"));
const react_1 = require("react");
const pgnParser_1 = require("@/util/parsers/pgnParser");
function useVariationTree(initialTree) {
    const tree = (0, useTreeData_1.default)(initialTree || []);
    //Key of the selectedNode
    const [currentKey, setCurrentKey] = (0, react_1.useState)(null);
    function loadNewTree(newTree) {
        setCurrentKey(null);
        tree.loadTree(newTree);
    }
    const currentNode = (0, react_1.useMemo)(() => {
        if (currentKey == null)
            return null;
        const node = tree.getNode(currentKey);
        if (!node)
            return null;
        return node;
    }, [currentKey, tree]);
    const moveText = (0, react_1.useMemo)(() => {
        return treeArrayToMoveText(tree.treeArray);
    }, [tree]);
    const mainLine = (0, react_1.useMemo)(() => {
        const root = tree.treeArray[0];
        let path = [];
        let currentNode = root;
        while (currentNode) {
            path.push(currentNode);
            currentNode = currentNode.children[0];
        }
        return path;
    }, [tree]);
    const rootNodes = (0, react_1.useMemo)(() => {
        const root = tree.treeArray[0];
        if (!root)
            return [];
        const nodes = tree.getSiblings(root.key);
        return nodes;
    }, [tree]);
    function treeArrayToMoveText(treeArray) {
        let movetext = "";
        let stack = [];
        let previousVariationDepth = 0;
        // for (let i = treeArray.length - 1; i > 0; i--) {
        //   stack.push(treeArray[i]);
        // }
        stack.push(treeArray[0]);
        while (stack.length) {
            const node = stack.pop();
            if (!node)
                break;
            const halfMoveCount = tree.getDepth(node.key);
            const variationDepth = tree.getPly(node.key);
            const depthChange = variationDepth - previousVariationDepth;
            const index = tree.getSiblingIndex(node.key);
            const siblings = tree.getSiblings(node.key).slice(1);
            if (depthChange > 1)
                throw new Error("Invalid tree structure");
            if (depthChange < 0) {
                for (let i = -1; i > depthChange; i--) {
                    movetext += ")";
                }
                movetext += " ";
            }
            if (index !== 0)
                movetext += "(";
            const isWhite = halfMoveCount % 2 == 0;
            if (depthChange !== 0 || index !== 0 || isWhite) {
                movetext += `${Math.floor(halfMoveCount / 2) + 1}${isWhite ? ". " : "... "}`;
            }
            movetext += `${node.data.PGN} ${node.data.annotations.length
                ? node.data.annotations.map((annotation) => `$${annotation}`).join(" ")
                : ""} ${(0, pgnParser_1.encodeCommentFromNodeData)(node.data)}`;
            if (!node.children[0] && (index !== 0 || siblings.length === 0) && variationDepth !== 0)
                movetext += ")";
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
    return {
        tree,
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
        stepBackward,
        stepForward,
        treeArray: tree.treeArray,
    };
}
exports.default = useVariationTree;

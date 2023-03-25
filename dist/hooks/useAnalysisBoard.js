"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const settings_1 = require("@/context/settings");
const use_sound_1 = __importDefault(require("use-sound"));
const useVariationTree_1 = __importDefault(require("./useVariationTree"));
const useLocalEval_1 = __importDefault(require("./useLocalEval"));
const useDebounce_1 = __importDefault(require("./useDebounce"));
const useOpeningExplorer_1 = __importDefault(require("./useOpeningExplorer"));
const Chess = __importStar(require("@/lib/chess"));
const lodash_1 = __importDefault(require("lodash"));
const defaultOptions = {
    startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    evalEnabled: true,
    readonly: false,
};
const pgnParser_1 = require("@/util/parsers/pgnParser");
function useAnalysisBoard(initialOptions) {
    const [options, setOptions] = (0, react_1.useState)(() => {
        return Object.assign(Object.assign({}, defaultOptions), initialOptions);
    });
    const { settings } = (0, react_1.useContext)(settings_1.SettingsContext);
    const { id } = options;
    const [evalEnabled, setEvalEnabled] = (0, react_1.useState)(() => options.evalEnabled);
    const [startPosEval, setStartPosEval] = (0, react_1.useState)();
    const evaler = (0, useLocalEval_1.default)();
    const initialGame = (0, react_1.useMemo)(() => {
        const game = Chess.createGame({
            startPosition: options.startPosition,
            timeControls: null,
        });
        return game;
    }, []);
    const initialTree = (0, react_1.useMemo)(() => {
        if (options.pgnSource) {
            try {
                const { tree, tagData } = (0, pgnParser_1.parsePgn)(options.pgnSource);
                if (tagData.fen) {
                    setOptions((cur) => {
                        return Object.assign(Object.assign({}, cur), { startPosition: tagData.fen || defaultOptions.startPosition });
                    });
                }
                return tree;
            }
            catch (e) {
                console.log(e);
                return [];
            }
        }
    }, [options.pgnSource, options.startPosition]);
    const variationTree = (0, useVariationTree_1.default)(initialTree);
    const loadPgn = (pgn) => {
        try {
            const { tree, tagData } = (0, pgnParser_1.parsePgn)(pgn);
            if (tagData.fen) {
                setOptions((cur) => {
                    return Object.assign(Object.assign({}, cur), { startPosition: tagData.fen || defaultOptions.startPosition });
                });
            }
            variationTree.loadNewTree(tree);
        }
        catch (e) {
            console.error(e);
        }
    };
    const { currentNode, path, continuation, stepBackward, stepForward, currentKey, moveText, mainLine, setCurrentKey } = variationTree;
    (0, react_1.useEffect)(() => {
        const arrowKeyHandler = (e) => {
            if (e.code === "ArrowRight") {
                stepForward();
            }
            else if (e.code === "ArrowLeft") {
                stepBackward();
            }
        };
        document.addEventListener("keydown", arrowKeyHandler);
        return () => {
            document.removeEventListener("keydown", arrowKeyHandler);
        };
    }, [stepForward, stepBackward]);
    const currentGame = (0, react_1.useMemo)(() => {
        if (currentNode === null)
            return initialGame;
        return Chess.gameFromNodeData(currentNode.data, options.startPosition, path.map((node) => node.data));
    }, [currentNode, initialGame, options.startPosition, path]);
    const explorer = (0, useOpeningExplorer_1.default)(currentGame);
    //Move sounds
    const [playMove] = (0, use_sound_1.default)("/assets/sounds/move.wav", { volume: settings.sound.volume / 100 });
    const [playCapture] = (0, use_sound_1.default)("/assets/sounds/capture.wav", {
        volume: settings.sound.volume / 100,
    });
    const [playCastle] = (0, use_sound_1.default)("/assets/sounds/castle.wav", {
        volume: settings.sound.volume / 100,
    });
    const lastMove = currentGame.lastMove;
    (0, react_1.useEffect)(() => {
        if (lastMove && settings.sound.moveSounds) {
            if (lastMove.capture)
                playCapture();
            else if (lastMove.isCastle)
                playCastle();
            else
                playMove();
        }
    }, [lastMove, playMove, playCapture, playCastle]);
    const cacheEvaluation = (0, react_1.useCallback)((nodeId, evaluation) => {
        variationTree.tree.updateNode(nodeId, {
            evaluation,
        });
    }, [variationTree.tree]);
    const updateComment = (0, react_1.useCallback)((nodeId, comment) => {
        const node = variationTree.tree.getNode(nodeId);
        if (!node)
            return;
        variationTree.tree.updateNode(nodeId, {
            comment: comment.length ? comment : null,
        });
    }, [variationTree.tree]);
    const updateAnnotations = (0, react_1.useCallback)((nodeId, annotations) => {
        const node = variationTree.tree.getNode(nodeId);
        if (!node)
            return;
        variationTree.tree.updateNode(nodeId, {
            annotations,
        });
    }, [variationTree.tree]);
    const updateArrows = (0, react_1.useCallback)((nodeId, arrows) => {
        const node = variationTree.tree.getNode(nodeId);
        if (!node)
            return;
        variationTree.tree.updateNode(nodeId, {
            arrows,
        });
    }, [variationTree.tree]);
    const updateMarkedSquares = (0, react_1.useCallback)((nodeId, markedSquares) => {
        const node = variationTree.tree.getNode(nodeId);
        if (!node)
            return;
        variationTree.tree.updateNode(nodeId, {
            markedSquares,
        });
    }, [variationTree.tree]);
    const clearMarkup = (0, react_1.useCallback)((nodeId) => {
        const node = variationTree.tree.getNode(nodeId);
        if (!node)
            return;
        variationTree.tree.updateNode(nodeId, {
            markedSquares: [],
            arrows: [],
        });
    }, [variationTree.tree]);
    //Debounce data change for evaler/api request
    const debouncedNode = (0, useDebounce_1.default)(currentNode, 300);
    const currentNodeKey = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => {
        if (currentNodeKey.current === ((debouncedNode === null || debouncedNode === void 0 ? void 0 : debouncedNode.key) || null)) {
            return;
        }
        if (!evalEnabled) {
            evaler.stop();
        }
        if (evaler.isReady && evalEnabled) {
            currentNodeKey.current = (debouncedNode === null || debouncedNode === void 0 ? void 0 : debouncedNode.key) || null;
            if (!debouncedNode) {
                evaler.getEvaluation(initialGame.fen, startPosEval).then((result) => {
                    if (result) {
                        setStartPosEval(result);
                    }
                });
            }
            else {
                let fen = debouncedNode.data.fen;
                const game = Chess.gameFromNodeData(debouncedNode.data);
                if (!game.legalMoves.some((move) => move.capture && move.end === game.enPassantTarget)) {
                    const args = fen.split(" ");
                    args[3] = "-";
                    fen = args.join(" ");
                }
                evaler.getEvaluation(fen, debouncedNode.data.evaluation).then((result) => {
                    if (result)
                        cacheEvaluation(debouncedNode.key, result);
                });
            }
        }
    }, [evaler.isReady, debouncedNode, evalEnabled, cacheEvaluation, initialGame, startPosEval]);
    const currentLine = (0, react_1.useMemo)(() => {
        return [...path, ...continuation];
    }, [path, continuation]);
    const onMove = (0, react_1.useCallback)((move) => {
        const existingMoveKey = variationTree.findNextMove(Chess.MoveToUci(move));
        if (existingMoveKey) {
            const next = variationTree.setCurrentKey(existingMoveKey);
            //if (next) evaler.getEvaluation(next.data.fen);
        }
        else {
            const halfMoveCount = variationTree.path.length + 1;
            const nodeToInsert = Chess.nodeDataFromMove(currentGame, move, halfMoveCount);
            variationTree.addMove(nodeToInsert);
            //evaler.getEvaluation(nodeToInsert.fen);
        }
    }, [currentGame, variationTree]);
    const jumpForward = (0, react_1.useCallback)(() => {
        const node = currentLine[currentLine.length - 1];
        setCurrentKey((node === null || node === void 0 ? void 0 : node.key) || null);
    }, [currentLine]);
    const jumpBackward = () => {
        setCurrentKey(null);
    };
    const [moveQueue, setMoveQueue] = (0, react_1.useState)([]);
    const prevGame = (0, react_1.useRef)(initialGame);
    const prevMoveQueue = (0, react_1.useRef)([]);
    (0, react_1.useEffect)(() => {
        if (lodash_1.default.isEqual(prevGame, currentGame))
            return; //"don't execute if a the game hasn't updated"
        prevGame.current === currentGame;
        if (!moveQueue.length)
            return;
        const move = currentGame.legalMoves.find((move) => move.PGN === moveQueue[0]);
        if (move) {
            setTimeout(() => {
                onMove(move);
                setMoveQueue((cur) => cur.slice(1));
            }, 200);
        }
        else {
            console.error("Invalid move in move queue");
        }
    }, [moveQueue, currentGame, onMove, prevGame]);
    return {
        loadPgn,
        moveText,
        mainLine,
        rootNodes: variationTree.rootNodes,
        currentGame,
        onMove,
        evaler,
        evalEnabled,
        setEvalEnabled,
        boardControls: { stepBackward, stepForward, jumpBackward, jumpForward },
        variations: variationTree.treeArray,
        setCurrentKey,
        currentLine,
        path,
        setMoveQueue,
        currentKey,
        currentNode,
        debouncedNode,
        explorer,
        commentControls: {
            updateComment,
            updateAnnotations,
        },
        markupControls: {
            updateArrows,
            updateMarkedSquares,
            clearMarkup,
        },
    };
}
exports.default = useAnalysisBoard;

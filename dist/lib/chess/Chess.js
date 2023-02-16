"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeDataFromMove = exports.MoveToUci = exports.halfMoveToNode = exports.gameFromNodeData = exports.getSquareColor = exports.positionToBoard = exports.serializeMoves = exports.exportFEN = exports.exportPGN = exports.move = exports.createGame = exports.Game = exports.testMove = exports.executeMove = exports.getMoves = exports.getMaterialCount = exports.toSquare = exports.squareToCoordinates = void 0;
const ChessTypes_1 = require("./ChessTypes");
const lodash_1 = __importDefault(require("lodash"));
const FenParser_1 = require("./FenParser");
const PGN_1 = require("./PGN");
/*---------------------------------------------------------
Stringify coordinates to algebraic notation
---------------------------------------------------------*/
function squareToCoordinates(square) {
    const x = ChessTypes_1.FileEnum[square.charAt(0)];
    const y = parseInt(square.charAt(1)) - 1;
    return [x, y];
}
exports.squareToCoordinates = squareToCoordinates;
function toSquare(coordinates) {
    const [x, y] = coordinates;
    const rank = y + 1;
    const file = ChessTypes_1.FileEnum[x];
    return `${file}${rank}`;
}
exports.toSquare = toSquare;
/*---------------------------------------------------------
Piece Movement
---------------------------------------------------------*/
//Given a piece and its starting square, generates a set of movement rules to evaluate potential moves
function getMovementRules(piece, start) {
    const coordinates = squareToCoordinates(start);
    const { type, color } = piece;
    //Color multiplier used to determine pawn directions
    const colorMult = color === "w" ? 1 : -1;
    const y = coordinates[1];
    //Pawn on original rank can double push
    const canDoublePush = (color === "w" && y === 1) || (color === "b" && y === 6);
    switch (type) {
        case "p":
            return [
                {
                    increment: [0, 1 * colorMult],
                    canCapture: false,
                    captureOnly: false,
                    range: canDoublePush ? 2 : 1,
                },
                {
                    increment: [1, 1 * colorMult],
                    canCapture: true,
                    captureOnly: true,
                    range: 1,
                },
                {
                    increment: [-1, 1 * colorMult],
                    canCapture: true,
                    captureOnly: true,
                    range: 1,
                },
            ];
        case "b":
            return [
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1],
            ].map((increment) => ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: null,
            }));
        case "r":
            return [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ].map((increment) => ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: null,
            }));
        case "q":
            return [
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1],
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ].map((increment) => ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: null,
            }));
        case "k":
            return [
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1],
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ].map((increment) => ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: 1,
            }));
        case "n":
            return [
                [1, 2],
                [1, -2],
                [2, 1],
                [2, -1],
                [-1, 2],
                [-1, -2],
                [-2, 1],
                [-2, -1],
            ].map((increment) => ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: 1,
            }));
        default:
            throw new Error(`Type:${type} is not a valid piece type`);
    }
}
function evaluateRule(rule, position, start, enPassantTarget = null) {
    var _a, _b;
    const { increment, canCapture, captureOnly, range } = rule;
    const startingCoordinates = squareToCoordinates(start);
    const piece = position.get(start);
    if (!piece)
        throw new Error(`No piece at starting square ${start}}`);
    const activeColor = piece.color;
    //Initialize return variables
    var controlledSquares = [];
    var potentialMoves = [];
    var containsCheck = false;
    var currentCoordinates = startingCoordinates;
    var i = 0;
    const promotions = ["r", "q", "n", "b"];
    //loop as long as current coordinates are still on the board or the range is reached
    while (currentCoordinates.every((coord) => coord >= 0 && coord <= 7) && (!range || i < range)) {
        //increment by the rule values and make sure the resulting coordinates are still on the board
        currentCoordinates = currentCoordinates.map((coord, idx) => coord + increment[idx]);
        i++;
        if (!currentCoordinates.every((coord) => coord >= 0 && coord <= 7))
            break;
        // check the square for pieces
        let currentSquare = toSquare(currentCoordinates);
        let isPromotion = piece.type === "p" && currentCoordinates[1] === (piece.color === "w" ? 7 : 0);
        if (position.has(currentSquare)) {
            //break if the piece is of the same color or the piece can't capture in the given direction
            if (((_a = position.get(currentSquare)) === null || _a === void 0 ? void 0 : _a.color) === activeColor)
                break;
            if (!canCapture)
                break;
            if (((_b = position.get(currentSquare)) === null || _b === void 0 ? void 0 : _b.type) === "k") {
                containsCheck = true;
            }
            if (isPromotion) {
                promotions.forEach((type) => {
                    potentialMoves.push({
                        start: start,
                        end: toSquare(currentCoordinates),
                        capture: toSquare(currentCoordinates),
                        promotion: type,
                    });
                });
            }
            else {
                potentialMoves.push({
                    start: start,
                    end: toSquare(currentCoordinates),
                    capture: toSquare(currentCoordinates),
                });
            }
            break;
        }
        else {
            // en passant capture
            if (toSquare(currentCoordinates) === enPassantTarget && piece.type === "p" && canCapture) {
                potentialMoves.push({
                    start: start,
                    end: toSquare(currentCoordinates),
                    capture: toSquare([currentCoordinates[0], currentCoordinates[1] + (piece.color === "w" ? -1 : 1)]),
                });
            }
            else {
                controlledSquares.push(toSquare(currentCoordinates));
                if (!captureOnly) {
                    if (isPromotion) {
                        promotions.forEach((type) => {
                            potentialMoves.push({
                                start: start,
                                end: toSquare(currentCoordinates),
                                capture: null,
                                promotion: type,
                            });
                        });
                    }
                    else {
                        potentialMoves.push({
                            start: start,
                            end: toSquare(currentCoordinates),
                            capture: null,
                        });
                    }
                }
            }
        }
    }
    return {
        potentialMoves,
        containsCheck,
        controlledSquares,
    };
}
/*---------------------------------------------------------
Movement utilites
---------------------------------------------------------*/
//Determine if a move is a double pawn push
function isDoublePush(move) {
    const start = squareToCoordinates(move.start);
    const end = squareToCoordinates(move.end);
    const diff = Math.abs(end[1] - start[1]);
    return diff === 2;
}
//Returns the resulting en passant target from a double pawn push
function getTargetSquare(move) {
    const start = squareToCoordinates(move.start);
    const end = squareToCoordinates(move.end);
    const direction = Math.abs(end[1] - start[1]) === end[1] - start[1] ? 1 : -1;
    return toSquare([start[0], start[1] + direction]);
}
function getMaterialCount(position) {
    const pieceValues = {
        k: 1,
        n: 3,
        b: 3,
        p: 1,
        r: 5,
        q: 8,
    };
    let w = 0;
    let b = 0;
    for (let [square, piece] of position) {
        if (piece.color === "w") {
            w = w + pieceValues[piece.type];
        }
        else {
            b = b + pieceValues[piece.type];
        }
    }
    return { w, b };
}
exports.getMaterialCount = getMaterialCount;
//Determine if a give move results in a check
function moveIsCheck(game, move) {
    var _a;
    const { updatedGameState } = executeMove(game, move);
    const position = new Map(updatedGameState.position);
    const color = (_a = position.get(move.end)) === null || _a === void 0 ? void 0 : _a.color;
    for (let [square, piece] of position) {
        if (piece.color === color) {
            const rules = getMovementRules(piece, square);
            const check = rules.some((rule) => {
                const { containsCheck } = evaluateRule(rule, position, square);
                return containsCheck;
            });
            if (check)
                return true;
        }
    }
    return false;
}
//Returns false is a given move leaves the king in check
function verifyMove(move, position) {
    //first determine the active color and execute the move);
    const piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move: no piece exists on the starting square");
    const activeColor = piece.color;
    const endPosition = new Map(position);
    //delete the capture square
    if (move.capture !== null)
        endPosition.delete(move.capture);
    //execute the move
    endPosition.set(move.end, piece);
    endPosition.delete(move.start);
    for (let [square, piece] of endPosition) {
        //only evaluate pieces of the opposite color
        if (piece.color !== activeColor) {
            const rules = getMovementRules(piece, square);
            const hasCheck = rules.some((rule) => {
                let { containsCheck } = evaluateRule(rule, endPosition, square);
                return containsCheck;
            });
            //if the piece checks the king, immediately return false
            if (hasCheck)
                return false;
        }
    }
    return true;
}
//Returns an array of all the legal moves in a position
function getMoves(game) {
    const { activeColor, position, enPassantTarget, castleRights } = game;
    const { kingSide, queenSide } = castleRights[activeColor];
    let moves = [];
    let opponentControlledSquares = [];
    for (let [start, piece] of position) {
        //Evaluate pieces of the active color
        if (piece.color == activeColor) {
            const rules = getMovementRules(piece, start);
            rules.forEach((rule) => {
                const { potentialMoves } = evaluateRule(rule, position, start, enPassantTarget);
                potentialMoves.forEach((move) => {
                    if (verifyMove(move, position)) {
                        let isCheck = moveIsCheck(game, move);
                        if (isCheck) {
                            moves.push(Object.assign(Object.assign({}, move), { isCheck }));
                        }
                        else {
                            moves.push(move);
                        }
                    }
                });
            });
        }
        //Only evaluate opposing pieces if castling rights are available
        else if (kingSide || queenSide) {
            const rules = getMovementRules(piece, start);
            rules.forEach((rule) => {
                const { controlledSquares } = evaluateRule(rule, position, start, enPassantTarget);
                controlledSquares.forEach((square) => opponentControlledSquares.push(square));
            });
        }
    }
    const castles = getCastles(game, opponentControlledSquares);
    castles.forEach((move) => {
        let isCheck = moveIsCheck(game, move);
        if (isCheck) {
            moves.push(Object.assign(Object.assign({}, move), { isCheck }));
        }
        else {
            moves.push(move);
        }
    });
    return moves.map((move, idx, moves) => {
        const PGN = (0, PGN_1.moveToPgn)(move, game.position, moves);
        return Object.assign(Object.assign({}, move), { PGN: PGN });
    });
}
exports.getMoves = getMoves;
//Return an array of the legal castling moves
function getCastles(game, opponentControlledSquares) {
    const { activeColor, position, castleRights } = game;
    let moves = [];
    let squares = activeColor === "w" ? { k: ["f1", "g1"], q: ["b1", "c1", "d1"] } : { k: ["f8", "g8"], q: ["b8", "c8", "d8"] };
    const { kingSide, queenSide } = castleRights[activeColor];
    if (!kingSide && !queenSide) {
        return moves;
    }
    if (kingSide &&
        squares.k.every((square) => {
            return !position.has(square) && !opponentControlledSquares.includes(square);
        })) {
        moves.push({
            start: activeColor === "w" ? "e1" : "e8",
            end: activeColor === "w" ? "g1" : "g8",
            capture: null,
            isCastle: true,
            PGN: "O-O",
        });
    }
    if (queenSide &&
        squares.q.every((square) => {
            return !position.has(square) && !opponentControlledSquares.includes(square);
        })) {
        moves.push({
            start: activeColor === "w" ? "e1" : "e8",
            end: activeColor === "w" ? "c1" : "c8",
            capture: null,
            isCastle: true,
            PGN: "",
        });
    }
    return moves;
}
//Executes as move, returns the updated game state and the captured piece
function executeMove(game, move) {
    const position = new Map(game.position);
    const piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move");
    const capture = move.capture ? position.get(move.capture) || null : null;
    // Switch color and increment the move counters
    const activeColor = game.activeColor === "w" ? "b" : "w";
    const fullMoveCount = game.fullMoveCount + (game.activeColor === "b" ? 1 : 0);
    //Reset half move count on a pawn push or capture
    const halfMoveCount = piece.type === "p" || move.capture !== null ? 0 : game.halfMoveCount + 1;
    var enPassantTarget = null;
    const castleMap = {
        g1: ["h1", "f1"],
        c1: ["a1", "d1"],
        g8: ["h8", "f8"],
        c8: ["a8", "d8"],
    };
    var castleRights = Object.assign({}, game.castleRights[game.activeColor]);
    if (move.isCastle) {
        let [start, end] = castleMap[move.end];
        let rook = position.get(start);
        if (!rook) {
            console.log(move);
            console.log(game);
            throw new Error("Move is invalid.");
        }
        position.set(end, rook);
        position.delete(start);
        position.set(move.end, piece);
        position.delete(move.start);
        //remove castle rights
        castleRights.kingSide = false;
        castleRights.queenSide = false;
    }
    else if (move.promotion) {
        if (move.capture)
            position.delete(move.capture);
        position.set(move.end, Object.assign(Object.assign({}, piece), { type: move.promotion }));
        position.delete(move.start);
    }
    else {
        //remove the captured piece, execute the move
        if (move.capture)
            position.delete(move.capture);
        position.set(move.end, piece);
        position.delete(move.start);
        //Set the en passant target is the pawn is double pushed
        if (piece.type === "p" && isDoublePush(move)) {
            enPassantTarget = getTargetSquare(move);
        }
        //Remove corresponding castle rights on rook or king move
        if (piece.type === "r" && (castleRights.kingSide || castleRights.queenSide)) {
            const coords = squareToCoordinates(move.start);
            if (coords[1] === 7 && coords[0] === (activeColor === "w" ? 0 : 7))
                castleRights.queenSide = false;
            if (coords[1] === 0 && coords[0] === (activeColor === "w" ? 0 : 7))
                castleRights.kingSide = false;
        }
        if (piece.type === "k") {
            castleRights.kingSide = false;
            castleRights.queenSide = false;
        }
    }
    const updatedGame = {
        activeColor,
        position,
        enPassantTarget,
        halfMoveCount,
        fullMoveCount,
        castleRights: Object.assign(Object.assign({}, game.castleRights), { [game.activeColor]: castleRights }),
    };
    return {
        updatedGameState: updatedGame,
        capturedPiece: capture,
    };
}
exports.executeMove = executeMove;
function testMove(game, move) {
    const position = new Map(game.position);
    const piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move");
    const capture = move.capture ? position.get(move.capture) || null : null;
    // Switch color and increment the move counters
    const activeColor = game.activeColor === "w" ? "b" : "w";
    const fullMoveCount = game.fullMoveCount + (game.activeColor === "b" ? 1 : 0);
    //Reset half move count on a pawn push or capture
    const halfMoveCount = piece.type === "p" || move.capture !== null ? 0 : game.halfMoveCount + 1;
    var enPassantTarget = null;
    const castleMap = {
        g1: ["h1", "f1"],
        c1: ["a1", "d1"],
        g8: ["h8", "f8"],
        c8: ["a8", "f8"],
    };
    var castleRights = Object.assign({}, game.castleRights[game.activeColor]);
    if (move.isCastle) {
        let [start, end] = castleMap[move.end];
        let rook = position.get(start);
        if (!rook) {
            console.log(move);
            console.log(game);
            throw new Error("Move is invalid.");
        }
        position.set(end, rook);
        position.delete(start);
        position.set(move.end, piece);
        position.delete(move.start);
        //remove castle rights
        castleRights.kingSide = false;
        castleRights.queenSide = false;
    }
    else if (move.promotion) {
        if (move.capture)
            position.delete(move.capture);
        position.set(move.end, Object.assign(Object.assign({}, piece), { type: move.promotion }));
        position.delete(move.start);
    }
    else {
        //remove the captured piece, execute the move
        if (move.capture)
            position.delete(move.capture);
        position.set(move.end, piece);
        position.delete(move.start);
        //Set the en passant target is the pawn is double pushed
        if (piece.type === "p" && isDoublePush(move)) {
            enPassantTarget = getTargetSquare(move);
        }
        //Remove corresponding castle rights on rook or king move
        if (piece.type === "r" && (castleRights.kingSide || castleRights.queenSide)) {
            const coords = squareToCoordinates(move.start);
            if (coords[1] === 7 && coords[0] === (activeColor === "w" ? 0 : 7))
                castleRights.queenSide = false;
            if (coords[1] === 0 && coords[0] === (activeColor === "w" ? 0 : 7))
                castleRights.kingSide = false;
        }
        if (piece.type === "k") {
            castleRights.kingSide = false;
            castleRights.queenSide = false;
        }
    }
    const updatedGame = {
        activeColor,
        position,
        enPassantTarget,
        halfMoveCount,
        fullMoveCount,
        castleRights: Object.assign(Object.assign({}, game.castleRights), { [activeColor]: castleRights }),
    };
    return {
        updatedGameState: updatedGame,
        capturedPiece: capture,
    };
}
exports.testMove = testMove;
class Game {
    constructor(gameConfig) {
        const initialGameState = (0, FenParser_1.fenToGameState)(gameConfig.startPosition);
        if (!initialGameState)
            throw new Error("Config is invalid: Invalid FEN passed to start position");
        const { castleRights, position, activeColor, halfMoveCount, fullMoveCount, enPassantTarget } = initialGameState;
        const legalMoves = getMoves(initialGameState);
        const board = positionToBoard(position);
        Object.assign(this, {
            castleRights,
            activeColor,
            halfMoveCount,
            fullMoveCount,
            enPassantTarget,
        });
        this.legalMoves = legalMoves;
        this.moveHistory = [];
        this.capturedPieces = [];
        this.config = gameConfig;
        this.lastMove = null;
        this.board = injectTargets(board, legalMoves);
        this.fen = gameConfig.startPosition;
    }
}
exports.Game = Game;
const defaultConfig = {
    startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    timeControls: null,
};
function createGame(options) {
    const config = Object.assign(Object.assign({}, defaultConfig), options);
    const game = new Game(config);
    return game;
}
exports.createGame = createGame;
function isThreeFoldRepetition(moveHistory, gameState) {
    var repetitions = 0;
    const fenA = (0, FenParser_1.trimMoveCounts)((0, FenParser_1.gameStateToFen)(gameState));
    moveHistory.forEach((fullMove) => {
        fullMove.forEach((move) => {
            if (!move)
                return;
            const fenB = (0, FenParser_1.trimMoveCounts)(move.fen);
            if (fenA === fenB)
                repetitions = repetitions + 1;
        });
    });
    if (repetitions > 2)
        return true;
    return false;
}
//execute a move and return the updated game
function move(gameInitial, move, elapsedTimeSeconds) {
    const game = lodash_1.default.clone(gameInitial);
    var outcome = game.outcome;
    //verify the move is listed as one of the available moves
    const moveIsLegal = game.legalMoves.some((availableMove) => lodash_1.default.isEqual(move, availableMove));
    const updatedMoveHistory = Array.from(game.moveHistory);
    if (!moveIsLegal)
        throw new Error("Move is not in available moves");
    //execute the move and update the gameState and captured pieces
    const { castleRights, activeColor, halfMoveCount, fullMoveCount, enPassantTarget } = game;
    const position = boardToPosition(game.board);
    const gameState = {
        position,
        castleRights,
        activeColor,
        halfMoveCount,
        fullMoveCount,
        enPassantTarget,
    };
    const { updatedGameState, capturedPiece } = executeMove(gameState, move);
    const capturedPieces = game.capturedPieces;
    if (capturedPiece)
        capturedPieces.push(capturedPiece);
    // CHECK FOR GAME OUTCOMES
    //update the legal moves
    let updatedLegalMoves = getMoves(updatedGameState);
    //If there are no legal moves, result is checkmate or stalemate
    if (updatedLegalMoves.length === 0) {
        if (move.isCheck) {
            outcome = { result: activeColor, by: "checkmate" };
            //set move.isCheckmate for Move history/pgn
            move.isCheckMate = true;
        }
        else {
            outcome = { result: "d", by: "stalemate" };
        }
    }
    //TODO: Check for insufficient Material
    const { position: updatedPosition } = updatedGameState, rest = __rest(updatedGameState, ["position"]);
    //Check for repitition
    if (isThreeFoldRepetition(game.moveHistory, updatedGameState)) {
        outcome = { result: "d", by: "repitition" };
    }
    //Check for 50 move rule
    if (updatedGameState.halfMoveCount >= 100) {
        outcome = { result: "d", by: "50-move-rule" };
    }
    const fen = (0, FenParser_1.gameStateToFen)(updatedGameState);
    const updatedBoard = positionToBoard(updatedPosition);
    //Push to move history
    const halfMove = {
        move: move,
        PGN: (0, PGN_1.moveToPgn)(move, position, game.legalMoves),
        fen: (0, FenParser_1.gameStateToFen)(updatedGameState),
        board: injectTargets(updatedBoard, updatedLegalMoves),
        elapsedTimeSeconds,
    };
    if (activeColor === "b") {
        const moveIdx = updatedMoveHistory.length - 1;
        updatedMoveHistory[moveIdx][1] = halfMove;
    }
    else {
        updatedMoveHistory.push([halfMove, null]);
    }
    //return the updated game
    const updatedGame = Object.assign(Object.assign(Object.assign({}, game), rest), { board: injectTargets(updatedBoard, updatedLegalMoves), moveHistory: updatedMoveHistory, legalMoves: updatedLegalMoves, lastMove: move, capturedPieces,
        outcome,
        fen });
    return updatedGame;
}
exports.move = move;
function injectTargets(board, legalMoves) {
    const withTargets = board.map((entry) => {
        const [square, piece] = entry;
        const targets = legalMoves.filter((move) => move.start === square).map((move) => move.end);
        return [square, Object.assign(Object.assign({}, piece), { targets })];
    });
    return withTargets;
}
//export function takeback(game: Game): Game {}
function exportPGN() { }
exports.exportPGN = exportPGN;
function exportFEN() { }
exports.exportFEN = exportFEN;
function serializeMoves(moves) {
    return moves.map((move) => `${move.start}:${move.end}:${move.capture || "-"}:${move.isCheck ? "+" : ""}${move.promotion ? ":=" + move.promotion : ""}`);
}
exports.serializeMoves = serializeMoves;
// export function deserializeMove(move: string): Move {
//   move.split(":")
// }
function positionToBoard(position) {
    return Array.from(position.entries());
}
exports.positionToBoard = positionToBoard;
function boardToPosition(board) {
    return new Map(board);
}
function getSquareColor(square) {
    const coordinates = squareToCoordinates(square);
    const testColor = coordinates[0] % 2 === coordinates[1] % 2;
    return testColor ? "b" : "w";
}
exports.getSquareColor = getSquareColor;
//Create a new game object from a tree node and it's given line
function gameFromNodeData(data, startPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", moves) {
    const board = data.board;
    const fen = data.fen;
    const game = createGame({ startPosition: fen, timeControls: null });
    let moveHistory = [];
    //convert the line into move history
    if (moves) {
        const halfMoves = moves.map((node) => {
            const { uci, evaluation, halfMoveCount, comment, annotations } = node, rest = __rest(node, ["uci", "evaluation", "halfMoveCount", "comment", "annotations"]);
            return Object.assign({}, rest);
        });
        const history = [];
        while (halfMoves.length > 0)
            history.push(halfMoves.splice(0, 2));
        moveHistory = history.map((fullmove) => {
            if (fullmove.length === 2) {
                return fullmove;
            }
            else {
                return [fullmove[0], null];
            }
        });
    }
    return Object.assign(Object.assign({}, game), { board, moveHistory, lastMove: data.move, config: Object.assign(Object.assign({}, game.config), { startPosition }) });
}
exports.gameFromNodeData = gameFromNodeData;
//Generate a new tree node from a halfmove
function halfMoveToNode(halfMoveCount, halfMove) {
    return Object.assign({ halfMoveCount, uci: MoveToUci(halfMove.move), comment: null, annotations: [] }, halfMove);
}
exports.halfMoveToNode = halfMoveToNode;
function MoveToUci(move) {
    return `${move.start}${move.end}${move.promotion ? move.promotion : ""}`;
}
exports.MoveToUci = MoveToUci;
function nodeDataFromMove(game, moveToExecute, halfMoveCount) {
    const updatedGame = move(game, moveToExecute);
    const lastMove = updatedGame.moveHistory[updatedGame.moveHistory.length - 1];
    const lastHalfMove = lastMove[1] || lastMove[0];
    const partialNode = halfMoveToNode(halfMoveCount, lastHalfMove);
    return Object.assign(Object.assign({}, partialNode), { halfMoveCount, outcome: updatedGame.outcome });
}
exports.nodeDataFromMove = nodeDataFromMove;

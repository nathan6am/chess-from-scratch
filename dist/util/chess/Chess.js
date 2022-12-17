"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMoves = exports.exportFEN = exports.exportPGN = exports.move = exports.createGame = exports.Game = exports.testMove = exports.executeMove = exports.getMoves = exports.getMaterialCount = exports.toSquare = exports.squareToCoordinates = void 0;
var ChessTypes_1 = require("./ChessTypes");
var lodash_1 = __importDefault(require("lodash"));
var FenParser_1 = require("./FenParser");
var PGN_1 = require("./PGN");
/*---------------------------------------------------------
Stringify coordinates to algebraic notation
---------------------------------------------------------*/
function squareToCoordinates(square) {
    var x = ChessTypes_1.FileEnum[square.charAt(0)];
    var y = parseInt(square.charAt(1)) - 1;
    return [x, y];
}
exports.squareToCoordinates = squareToCoordinates;
function toSquare(coordinates) {
    var _a = __read(coordinates, 2), x = _a[0], y = _a[1];
    var rank = y + 1;
    var file = ChessTypes_1.FileEnum[x];
    return "".concat(file).concat(rank);
}
exports.toSquare = toSquare;
/*---------------------------------------------------------
Piece Movement
---------------------------------------------------------*/
//Given a piece and its starting square, generates a set of movement rules to evaluate potential moves
function getMovementRules(piece, start) {
    var coordinates = squareToCoordinates(start);
    var type = piece.type, color = piece.color;
    //Color multiplier used to determine pawn directions
    var colorMult = color === "w" ? 1 : -1;
    var y = coordinates[1];
    //Pawn on original rank can double push
    var canDoublePush = (color === "w" && y === 1) || (color === "b" && y === 6);
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
            ].map(function (increment) { return ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: null,
            }); });
        case "r":
            return [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ].map(function (increment) { return ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: null,
            }); });
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
            ].map(function (increment) { return ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: null,
            }); });
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
            ].map(function (increment) { return ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: 1,
            }); });
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
            ].map(function (increment) { return ({
                increment: increment,
                canCapture: true,
                captureOnly: false,
                range: 1,
            }); });
        default:
            throw new Error("Type:".concat(type, " is not a valid piece type"));
    }
}
function evaluateRule(rule, position, start, enPassantTarget) {
    var _a, _b;
    if (enPassantTarget === void 0) { enPassantTarget = null; }
    var increment = rule.increment, canCapture = rule.canCapture, captureOnly = rule.captureOnly, range = rule.range;
    var startingCoordinates = squareToCoordinates(start);
    var piece = position.get(start);
    if (!piece)
        throw new Error("No piece at starting square ".concat(start, "}"));
    var activeColor = piece.color;
    //Initialize return variables
    var controlledSquares = [];
    var potentialMoves = [];
    var containsCheck = false;
    var currentCoordinates = startingCoordinates;
    var i = 0;
    var promotions = ["r", "q", "n", "b"];
    //loop as long as current coordinates are still on the board or the range is reached
    while (currentCoordinates.every(function (coord) { return coord >= 0 && coord <= 7; }) && (!range || i < range)) {
        //increment by the rule values and make sure the resulting coordinates are still on the board
        currentCoordinates = currentCoordinates.map(function (coord, idx) { return coord + increment[idx]; });
        i++;
        if (!currentCoordinates.every(function (coord) { return coord >= 0 && coord <= 7; }))
            break;
        // check the square for pieces
        var currentSquare = toSquare(currentCoordinates);
        var isPromotion = piece.type === "p" && currentCoordinates[1] === (piece.color === "w" ? 7 : 0);
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
                promotions.forEach(function (type) {
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
                        promotions.forEach(function (type) {
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
        potentialMoves: potentialMoves,
        containsCheck: containsCheck,
        controlledSquares: controlledSquares,
    };
}
/*---------------------------------------------------------
Movement utilites
---------------------------------------------------------*/
//Determine if a move is a double pawn push
function isDoublePush(move) {
    var start = squareToCoordinates(move.start);
    var end = squareToCoordinates(move.end);
    var diff = Math.abs(end[1] - start[1]);
    return diff === 2;
}
//Returns the resulting en passant target from a double pawn push
function getTargetSquare(move) {
    var start = squareToCoordinates(move.start);
    var end = squareToCoordinates(move.end);
    var direction = Math.abs(end[1] - start[1]) === end[1] - start[1] ? 1 : -1;
    return toSquare([start[0], start[1] + direction]);
}
function getMaterialCount(position) {
    var e_1, _a;
    var pieceValues = {
        k: 1,
        n: 3,
        b: 3,
        p: 1,
        r: 5,
        q: 8,
    };
    var w = 0;
    var b = 0;
    try {
        for (var position_1 = __values(position), position_1_1 = position_1.next(); !position_1_1.done; position_1_1 = position_1.next()) {
            var _b = __read(position_1_1.value, 2), square = _b[0], piece = _b[1];
            if (piece.color === "w") {
                w = w + pieceValues[piece.type];
            }
            else {
                b = b + pieceValues[piece.type];
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (position_1_1 && !position_1_1.done && (_a = position_1.return)) _a.call(position_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return { w: w, b: b };
}
exports.getMaterialCount = getMaterialCount;
//Determine if a give move results in a check
function moveIsCheck(game, move) {
    var e_2, _a;
    var _b;
    var updatedGameState = executeMove(game, move).updatedGameState;
    var position = new Map(updatedGameState.position);
    var color = (_b = position.get(move.end)) === null || _b === void 0 ? void 0 : _b.color;
    var _loop_1 = function (square, piece) {
        if (piece.color === color) {
            var rules = getMovementRules(piece, square);
            var check = rules.some(function (rule) {
                var containsCheck = evaluateRule(rule, position, square).containsCheck;
                return containsCheck;
            });
            if (check)
                return { value: true };
        }
    };
    try {
        for (var position_2 = __values(position), position_2_1 = position_2.next(); !position_2_1.done; position_2_1 = position_2.next()) {
            var _c = __read(position_2_1.value, 2), square = _c[0], piece = _c[1];
            var state_1 = _loop_1(square, piece);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (position_2_1 && !position_2_1.done && (_a = position_2.return)) _a.call(position_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return false;
}
//Returns false is a given move leaves the king in check
function verifyMove(move, position) {
    var e_3, _a;
    //first determine the active color and execute the move);
    var piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move: no piece exists on the starting square");
    var activeColor = piece.color;
    var endPosition = new Map(position);
    //delete the capture square
    if (move.capture !== null)
        endPosition.delete(move.capture);
    //execute the move
    endPosition.set(move.end, piece);
    endPosition.delete(move.start);
    var _loop_2 = function (square, piece_1) {
        //only evaluate pieces of the opposite color
        if (piece_1.color !== activeColor) {
            var rules = getMovementRules(piece_1, square);
            var hasCheck = rules.some(function (rule) {
                var containsCheck = evaluateRule(rule, endPosition, square).containsCheck;
                return containsCheck;
            });
            //if the piece checks the king, immediately return false
            if (hasCheck)
                return { value: false };
        }
    };
    try {
        for (var endPosition_1 = __values(endPosition), endPosition_1_1 = endPosition_1.next(); !endPosition_1_1.done; endPosition_1_1 = endPosition_1.next()) {
            var _b = __read(endPosition_1_1.value, 2), square = _b[0], piece_1 = _b[1];
            var state_2 = _loop_2(square, piece_1);
            if (typeof state_2 === "object")
                return state_2.value;
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (endPosition_1_1 && !endPosition_1_1.done && (_a = endPosition_1.return)) _a.call(endPosition_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return true;
}
//Returns an array of all the legal moves in a position
function getMoves(game) {
    var e_4, _a;
    var activeColor = game.activeColor, position = game.position, enPassantTarget = game.enPassantTarget, castleRights = game.castleRights;
    var _b = castleRights[activeColor], kingSide = _b.kingSide, queenSide = _b.queenSide;
    var moves = [];
    var opponentControlledSquares = [];
    var _loop_3 = function (start, piece) {
        //Evaluate pieces of the active color
        if (piece.color == activeColor) {
            var rules = getMovementRules(piece, start);
            rules.forEach(function (rule) {
                var potentialMoves = evaluateRule(rule, position, start, enPassantTarget).potentialMoves;
                potentialMoves.forEach(function (move) {
                    if (verifyMove(move, position)) {
                        var isCheck = moveIsCheck(game, move);
                        if (isCheck) {
                            moves.push(__assign(__assign({}, move), { isCheck: isCheck }));
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
            var rules = getMovementRules(piece, start);
            rules.forEach(function (rule) {
                var controlledSquares = evaluateRule(rule, position, start, enPassantTarget).controlledSquares;
                controlledSquares.forEach(function (square) { return opponentControlledSquares.push(square); });
            });
        }
    };
    try {
        for (var position_3 = __values(position), position_3_1 = position_3.next(); !position_3_1.done; position_3_1 = position_3.next()) {
            var _c = __read(position_3_1.value, 2), start = _c[0], piece = _c[1];
            _loop_3(start, piece);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (position_3_1 && !position_3_1.done && (_a = position_3.return)) _a.call(position_3);
        }
        finally { if (e_4) throw e_4.error; }
    }
    var castles = getCastles(game, opponentControlledSquares);
    castles.forEach(function (move) {
        var isCheck = moveIsCheck(game, move);
        if (isCheck) {
            moves.push(__assign(__assign({}, move), { isCheck: isCheck }));
        }
        else {
            moves.push(move);
        }
    });
    return moves;
}
exports.getMoves = getMoves;
//Return an array of the legal castling moves
function getCastles(game, opponentControlledSquares) {
    var activeColor = game.activeColor, position = game.position, castleRights = game.castleRights;
    var moves = [];
    var squares = activeColor === "w" ? { k: ["f1", "g1"], q: ["b1", "c1", "d1"] } : { k: ["f8", "g8"], q: ["b8", "c8", "d8"] };
    var _a = castleRights[activeColor], kingSide = _a.kingSide, queenSide = _a.queenSide;
    if (!kingSide && !queenSide) {
        return moves;
    }
    if (kingSide &&
        squares.k.every(function (square) {
            return !position.has(square) && !opponentControlledSquares.includes(square);
        })) {
        moves.push({
            start: activeColor === "w" ? "e1" : "e8",
            end: activeColor === "w" ? "g1" : "g8",
            capture: null,
            isCastle: true,
        });
    }
    if (queenSide &&
        squares.q.every(function (square) {
            return !position.has(square) && !opponentControlledSquares.includes(square);
        })) {
        moves.push({
            start: activeColor === "w" ? "e1" : "e8",
            end: activeColor === "w" ? "c1" : "c8",
            capture: null,
            isCastle: true,
        });
    }
    return moves;
}
//Executes as move, returns the updated game state and the captured piece
function executeMove(game, move) {
    var _a;
    var position = new Map(game.position);
    var piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move");
    var capture = move.capture ? position.get(move.capture) || null : null;
    // Switch color and increment the move counters
    var activeColor = game.activeColor === "w" ? "b" : "w";
    var fullMoveCount = game.fullMoveCount + (game.activeColor === "b" ? 1 : 0);
    //Reset half move count on a pawn push or capture
    var halfMoveCount = piece.type === "p" || move.capture !== null ? 0 : game.halfMoveCount + 1;
    var enPassantTarget = null;
    var castleMap = {
        g1: ["h1", "f1"],
        c1: ["a1", "d1"],
        g8: ["h8", "f8"],
        c8: ["a8", "d8"],
    };
    var castleRights = __assign({}, game.castleRights[game.activeColor]);
    if (move.isCastle) {
        var _b = __read(castleMap[move.end], 2), start = _b[0], end = _b[1];
        var rook = position.get(start);
        if (!rook)
            throw new Error("Move is invalid.");
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
        position.set(move.end, __assign(__assign({}, piece), { type: move.promotion }));
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
            var coords = squareToCoordinates(move.start);
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
    var updatedGame = {
        activeColor: activeColor,
        position: position,
        enPassantTarget: enPassantTarget,
        halfMoveCount: halfMoveCount,
        fullMoveCount: fullMoveCount,
        castleRights: __assign(__assign({}, game.castleRights), (_a = {}, _a[game.activeColor] = castleRights, _a)),
    };
    return {
        updatedGameState: updatedGame,
        capturedPiece: capture,
    };
}
exports.executeMove = executeMove;
function testMove(game, move) {
    var _a;
    var position = new Map(game.position);
    var piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move");
    var capture = move.capture ? position.get(move.capture) || null : null;
    // Switch color and increment the move counters
    var activeColor = game.activeColor === "w" ? "b" : "w";
    var fullMoveCount = game.fullMoveCount + (game.activeColor === "b" ? 1 : 0);
    //Reset half move count on a pawn push or capture
    var halfMoveCount = piece.type === "p" || move.capture !== null ? 0 : game.halfMoveCount + 1;
    var enPassantTarget = null;
    var castleMap = {
        g1: ["h1", "f1"],
        c1: ["a1", "d1"],
        g8: ["h8", "f8"],
        c8: ["a8", "f8"],
    };
    var castleRights = __assign({}, game.castleRights[game.activeColor]);
    if (move.isCastle) {
        var _b = __read(castleMap[move.end], 2), start = _b[0], end = _b[1];
        var rook = position.get(start);
        if (!rook)
            throw new Error("Move is invalid.");
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
        position.set(move.end, __assign(__assign({}, piece), { type: move.promotion }));
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
            var coords = squareToCoordinates(move.start);
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
    var updatedGame = {
        activeColor: activeColor,
        position: position,
        enPassantTarget: enPassantTarget,
        halfMoveCount: halfMoveCount,
        fullMoveCount: fullMoveCount,
        castleRights: __assign(__assign({}, game.castleRights), (_a = {}, _a[activeColor] = castleRights, _a)),
    };
    return {
        updatedGameState: updatedGame,
        capturedPiece: capture,
    };
}
exports.testMove = testMove;
var Game = /** @class */ (function () {
    function Game(gameConfig) {
        var initialGameState = (0, FenParser_1.fenToGameState)(gameConfig.startPosition);
        if (!initialGameState)
            throw new Error("Config is invalid: Invalid FEN passed to start position");
        var castleRights = initialGameState.castleRights, position = initialGameState.position, activeColor = initialGameState.activeColor, halfMoveCount = initialGameState.halfMoveCount, fullMoveCount = initialGameState.fullMoveCount, enPassantTarget = initialGameState.enPassantTarget;
        Object.assign(this, {
            castleRights: castleRights,
            activeColor: activeColor,
            halfMoveCount: halfMoveCount,
            fullMoveCount: fullMoveCount,
            enPassantTarget: enPassantTarget,
        });
        this.legalMoves = getMoves(initialGameState);
        this.moveHistory = [];
        this.capturedPieces = [];
        this.config = gameConfig;
        this.lastMove = null;
        this.board = positionToBoard(position);
        this.fen = gameConfig.startPosition;
    }
    return Game;
}());
exports.Game = Game;
function createGame(options) {
    if (options === void 0) { options = {
        startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        timeControls: null,
    }; }
    var game = new Game(options);
    return game;
}
exports.createGame = createGame;
function isThreeFoldRepetition(moveHistory, gameState) {
    var repetitions = 0;
    var fenA = (0, FenParser_1.trimMoveCounts)((0, FenParser_1.gameStateToFen)(gameState));
    moveHistory.forEach(function (fullMove) {
        fullMove.forEach(function (move) {
            if (!move)
                return;
            var fenB = (0, FenParser_1.trimMoveCounts)(move.fen);
            if (fenA === fenB)
                repetitions = repetitions + 1;
        });
    });
    if (repetitions > 2)
        return true;
    return false;
}
//execute a move and return the updated game
function move(game, move, elapsedTimeSeconds) {
    var outcome = game.outcome;
    //verify the move is listed as one of the available moves
    var moveIsLegal = game.legalMoves.some(function (availableMove) { return lodash_1.default.isEqual(move, availableMove); });
    var updatedMoveHistory = Array.from(game.moveHistory);
    if (!moveIsLegal)
        throw new Error("Move is not in available moves");
    //execute the move and update the gameState and captured pieces
    var castleRights = game.castleRights, activeColor = game.activeColor, halfMoveCount = game.halfMoveCount, fullMoveCount = game.fullMoveCount, enPassantTarget = game.enPassantTarget;
    var position = boardToPosition(game.board);
    var gameState = {
        position: position,
        castleRights: castleRights,
        activeColor: activeColor,
        halfMoveCount: halfMoveCount,
        fullMoveCount: fullMoveCount,
        enPassantTarget: enPassantTarget,
    };
    var _a = executeMove(gameState, move), updatedGameState = _a.updatedGameState, capturedPiece = _a.capturedPiece;
    var capturedPieces = game.capturedPieces;
    if (capturedPiece)
        capturedPieces.push(capturedPiece);
    // CHECK FOR GAME OUTCOMES
    //update the legal moves
    var updatedLegalMoves = getMoves(updatedGameState);
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
    var updatedPosition = updatedGameState.position, rest = __rest(updatedGameState, ["position"]);
    //Check for repitition
    if (isThreeFoldRepetition(game.moveHistory, updatedGameState)) {
        outcome = { result: "d", by: "repitition" };
    }
    //Check for 50 move rule
    if (updatedGameState.halfMoveCount >= 100) {
        outcome = { result: "d", by: "50-move-rule" };
    }
    var fen = (0, FenParser_1.gameStateToFen)(updatedGameState);
    //Push to move history
    var halfMove = {
        move: move,
        PGN: (0, PGN_1.moveToPgn)(move, position, game.legalMoves),
        fen: (0, FenParser_1.gameStateToFen)(updatedGameState),
        elapsedTimeSeconds: elapsedTimeSeconds,
    };
    if (activeColor === "b") {
        var moveIdx = updatedMoveHistory.length - 1;
        updatedMoveHistory[moveIdx][1] = halfMove;
    }
    else {
        updatedMoveHistory.push([halfMove, null]);
    }
    //return the updated game
    var updatedGame = __assign(__assign(__assign({}, game), rest), { board: positionToBoard(updatedPosition), moveHistory: updatedMoveHistory, legalMoves: updatedLegalMoves, lastMove: move, capturedPieces: capturedPieces, outcome: outcome, fen: fen });
    return updatedGame;
}
exports.move = move;
//export function takeback(game: Game): Game {}
function exportPGN() { }
exports.exportPGN = exportPGN;
function exportFEN() { }
exports.exportFEN = exportFEN;
function serializeMoves(moves) {
    return moves.map(function (move) {
        return "".concat(move.start, ":").concat(move.end, ":").concat(move.capture || "-", ":").concat(move.isCheck ? "+" : "").concat(move.promotion ? ":=" + move.promotion : "");
    });
}
exports.serializeMoves = serializeMoves;
// export function deserializeMove(move: string): Move {
//   move.split(":")
// }
function positionToBoard(position) {
    return Array.from(position.entries());
}
function boardToPosition(board) {
    return new Map(board);
}

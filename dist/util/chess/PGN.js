"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveToPgn = void 0;
var Chess_1 = require("./Chess");
var ChessTypes_1 = require("./ChessTypes");
var lodash_1 = __importDefault(require("lodash"));
//Returns the PGN notation of a move given the move and the current position
function moveToPgn(move, position, potentialMoves // Pass potential moves here to prevent from having to recalculate
) {
    var piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move or position");
    var color = piece.color;
    var notation = "";
    if (move.isCastle) {
        var coords = (0, Chess_1.squareToCoordinates)(move.end);
        console.log(coords);
        if (coords[0] === 6) {
            notation = "O-O";
        }
        else {
            notation = "O-O-O";
        }
    }
    else {
        var type = piece.type;
        //Add notation for pawn moves, captures and promotions
        if (type === "p") {
            if (move.capture) {
                notation = ChessTypes_1.FileEnum[(0, Chess_1.squareToCoordinates)(move.start)[0]] + "x" + move.end;
            }
            else {
                notation = move.end;
            }
            if (move.promotion)
                notation = "".concat(notation, "=").concat(move.promotion.toUpperCase());
        }
        else {
            //For non pawn moves, find potential ambiguous moves (pieces of the same type with the same end square)
            var ambiguousMoves = potentialMoves.filter(function (potentialMove) {
                var _a, _b;
                //filter out the original move
                if (lodash_1.default.isEqual(move, potentialMove))
                    return false;
                //only allow moves that end on the same square
                if (move.end !== potentialMove.end)
                    return false;
                //filter out moves with a different piece type
                if (((_a = position.get(move.start)) === null || _a === void 0 ? void 0 : _a.type) !== ((_b = position.get(potentialMove.start)) === null || _b === void 0 ? void 0 : _b.type))
                    return false;
                return true;
            });
            if (ambiguousMoves.length > 0) {
                notation = disambiguateMoves(move, position, ambiguousMoves);
            }
            else {
                notation = piece.type.toUpperCase();
            }
            if (move.capture)
                notation = notation + "x";
            notation = notation + move.end;
        }
    }
    if (move.isCheck && !move.isCheckMate)
        notation = notation + "+";
    if (move.isCheckMate)
        notation = notation + "#";
    return notation;
}
exports.moveToPgn = moveToPgn;
function disambiguateMoves(move, position, alternateMoves) {
    var piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move or position");
    var notation = piece.type.toUpperCase();
    //Attempt file disambiguation
    if (alternateMoves.every(function (altMove) {
        var fileA = ChessTypes_1.FileEnum[(0, Chess_1.squareToCoordinates)(move.start)[0]];
        var fileB = ChessTypes_1.FileEnum[(0, Chess_1.squareToCoordinates)(altMove.start)[0]];
        return fileA !== fileB;
    })) {
        return "".concat(notation).concat(ChessTypes_1.FileEnum[(0, Chess_1.squareToCoordinates)(move.start)[0]]);
    }
    //If file fails, attempt rank
    else if (alternateMoves.every(function (altMove) {
        var rankA = (0, Chess_1.squareToCoordinates)(move.start)[1];
        var rankB = (0, Chess_1.squareToCoordinates)(altMove.start)[1];
        return rankA !== rankB;
    })) {
        return "".concat(notation).concat(ChessTypes_1.FileEnum[(0, Chess_1.squareToCoordinates)(move.start)[0]]);
    }
    else {
        return "".concat(notation).concat(move.start);
    }
}
//TODO: Export Game to PGN
//TODO: Pgn to Game Object

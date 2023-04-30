"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveToPgn = void 0;
const Chess_1 = require("./Chess");
const ChessTypes_1 = require("./ChessTypes");
const lodash_1 = __importDefault(require("lodash"));
//Returns the PGN notation of a move given the move and the current position
function moveToPgn(move, position, potentialMoves // Pass potential moves here to prevent from having to recalculate
) {
    const piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move or position");
    const color = piece.color;
    var notation = "";
    if (move.isCastle) {
        let coords = (0, Chess_1.squareToCoordinates)(move.end);
        if (coords[0] === 6 || coords[0] === 7) {
            notation = "O-O";
        }
        else {
            notation = "O-O-O";
        }
    }
    else {
        const type = piece.type;
        //Add notation for pawn moves, captures and promotions
        if (type === "p") {
            if (move.capture) {
                notation = ChessTypes_1.FileEnum[(0, Chess_1.squareToCoordinates)(move.start)[0]] + "x" + move.end;
            }
            else {
                notation = move.end;
            }
            if (move.promotion)
                notation = `${notation}=${move.promotion.toUpperCase()}`;
        }
        else {
            //For non pawn moves, find potential ambiguous moves (pieces of the same type with the same end square)
            const ambiguousMoves = potentialMoves.filter((potentialMove) => {
                //filter out the original move
                if (lodash_1.default.isEqual(move, potentialMove))
                    return false;
                //only allow moves that end on the same square
                if (move.end !== potentialMove.end)
                    return false;
                //filter out moves with a different piece type
                if (position.get(move.start)?.type !== position.get(potentialMove.start)?.type)
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
    const piece = position.get(move.start);
    if (!piece)
        throw new Error("Invalid move or position");
    let notation = piece.type.toUpperCase();
    //Attempt file disambiguation
    if (alternateMoves.every((altMove) => {
        let fileA = ChessTypes_1.FileEnum[(0, Chess_1.squareToCoordinates)(move.start)[0]];
        let fileB = ChessTypes_1.FileEnum[(0, Chess_1.squareToCoordinates)(altMove.start)[0]];
        return fileA !== fileB;
    })) {
        return `${notation}${ChessTypes_1.FileEnum[(0, Chess_1.squareToCoordinates)(move.start)[0]]}`;
    }
    //If file fails, attempt rank
    else if (alternateMoves.every((altMove) => {
        let rankA = (0, Chess_1.squareToCoordinates)(move.start)[1];
        let rankB = (0, Chess_1.squareToCoordinates)(altMove.start)[1];
        return rankA !== rankB;
    })) {
        return `${notation}${(0, Chess_1.squareToCoordinates)(move.start)[1] + 1}`;
    }
    else {
        return `${notation}${move.start}`;
    }
}
//TODO: Export Game to PGN
//TODO: Pgn to Game Object

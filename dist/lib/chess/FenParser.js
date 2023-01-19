"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameStateToFen = exports.boardMapReverse = exports.boardMap = exports.trimMoveCounts = exports.fenToGameState = void 0;
const Chess_1 = require("./Chess");
const ChessTypes_1 = require("./ChessTypes");
/*------------------------------------------------------
Type Guards and Validators
------------------------------------------------------*/
function isValidColor(arg) {
    return ["w", "b"].some((element) => element === arg);
}
function isValidSquare(arg) {
    if (arg.length !== 2)
        return false;
    return (["a", "b", "c", "d", "e", "f", "g", "h"].some((char) => char === arg.charAt(0)) &&
        parseInt(arg.charAt(1)) > 0 &&
        parseInt(arg.charAt(1)) <= 8);
}
function validateBoard(board) {
    const rows = board.split("/");
    if (rows.length !== 8)
        return false;
    const validateRow = (rowString) => {
        const row = rowString.split("");
        //Verify there are exaclty 8 squares in the row
        if (row.length > 8 || row.length < 1)
            return false;
        const squaresInRow = row.reduce((total, current) => {
            if (/^[1-8]$/.test(current)) {
                return total + parseInt(current);
            }
            else {
                return total + 1;
            }
        }, 0);
        if (squaresInRow !== 8)
            return false;
        //Verify every character is either a valid number of empty squares or a valid piece
        return row.every((char) => {
            if (/^[1-8]$/.test(char)) {
                return true;
            }
            else if (/^[k,n,p,r,b,q]$/.test(char.toLowerCase())) {
                return true;
            }
            else {
                return false;
            }
        });
    };
    if (!rows.every((row) => validateRow(row)))
        return false;
    return true;
}
/*------------------------------------------------------
Parsing functions
------------------------------------------------------*/
function parseBoard(board) {
    let position = new Map();
    const rows = board.split("/");
    rows.forEach((row, idx) => {
        // Track the current coordinates on the board
        let x = 0;
        let y = 7 - idx;
        const chars = row.split("");
        chars.forEach((char) => {
            if (/^[1-8]$/.test(char)) {
                //if the character is a number, move the corresponding number of empty squares to the right
                x = x + parseInt(char);
            }
            else {
                position.set((0, Chess_1.toSquare)([x, y]), {
                    type: char.toLowerCase(),
                    color: char === char.toLowerCase() ? "b" : "w",
                    key: (0, Chess_1.toSquare)([x, y]),
                });
                x++;
            }
        });
    });
    return position;
}
function fenToGameState(fen) {
    //Split the string into sections and make sure they are all present
    const sections = fen.trim().split(" ");
    if (sections.length !== 6)
        return false;
    const [board, activeColor, castleRights, enPassantTarget, halfMoveCount, fullMoveCount] = sections;
    // Some guards to validate each section of the string before parsing them
    if (!isValidColor(activeColor))
        return false;
    if (!(/^[KkQq]+$/.test(castleRights) && castleRights.length <= 4) && castleRights !== "-")
        return false;
    if (!isValidSquare(enPassantTarget) && enPassantTarget !== "-")
        return false;
    if (!/^\d+$/.test(halfMoveCount) || !/^\d+$/.test(fullMoveCount))
        return false;
    if (!validateBoard(board))
        return false;
    return {
        position: parseBoard(board),
        activeColor: activeColor,
        castleRights: {
            w: {
                kingSide: castleRights.includes("K"),
                queenSide: castleRights.includes("Q"),
            },
            b: {
                kingSide: castleRights.includes("k"),
                queenSide: castleRights.includes("q"),
            },
        },
        enPassantTarget: enPassantTarget === "-" ? null : enPassantTarget,
        halfMoveCount: parseInt(halfMoveCount),
        fullMoveCount: parseInt(fullMoveCount),
    };
}
exports.fenToGameState = fenToGameState;
function trimMoveCounts(fen) {
    return fen.split(" ").slice(0, 4).join(" ");
}
exports.trimMoveCounts = trimMoveCounts;
/*------------------------------------------------------
Export to FEN
------------------------------------------------------*/
exports.boardMap = Array.from([0, 1, 2, 3, 4, 5, 6, 7]).map((n, idx) => {
    const rank = 8 - n;
    const row = [0, 1, 2, 3, 4, 5, 6, 7].map((file, index) => {
        const fileStr = ChessTypes_1.FileEnum[file];
        const square = `${fileStr}${rank}`;
        if (!isValidSquare(square))
            throw new Error("Invalid square on board map");
        return square;
    });
    return row;
});
exports.boardMapReverse = Array.from([7, 6, 5, 4, 3, 2, 1, 0]).map((n, idx) => {
    const rank = 8 - n;
    const row = [7, 6, 5, 4, 3, 2, 1, 0].map((file, index) => {
        const fileStr = ChessTypes_1.FileEnum[file];
        const square = `${fileStr}${rank}`;
        if (!isValidSquare(square))
            throw new Error("Invalid square on board map");
        return square;
    });
    return row;
});
function gameStateToFen(gameState) {
    const position = gameState.position;
    const positionString = positionToFen(position);
    const castleRights = gameState.castleRights;
    let castleRightsString = "";
    if (castleRights.w.kingSide)
        castleRightsString = castleRightsString + "K";
    if (castleRights.w.queenSide)
        castleRightsString = castleRightsString + "Q";
    if (castleRights.b.kingSide)
        castleRightsString = castleRightsString + "k";
    if (castleRights.b.queenSide)
        castleRightsString = castleRightsString + "q";
    if (castleRightsString.length === 0)
        castleRightsString = "-";
    const targetSquare = gameState.enPassantTarget || "-";
    return `${positionString} ${gameState.activeColor} ${castleRightsString} ${targetSquare} ${gameState.halfMoveCount} ${gameState.fullMoveCount}`;
}
exports.gameStateToFen = gameStateToFen;
function positionToFen(position) {
    let positionString = "";
    exports.boardMap.forEach((row, rowIdx) => {
        let emptySquares = 0;
        row.forEach((square, idx) => {
            if (position.has(square)) {
                if (emptySquares !== 0)
                    positionString = positionString + emptySquares.toString();
                emptySquares = 0;
                const piece = position.get(square);
                if (!piece)
                    throw new Error("invalid position");
                positionString = positionString + pieceToFen(piece);
            }
            else {
                emptySquares++;
            }
            if (idx === 7) {
                if (emptySquares !== 0)
                    positionString = positionString + emptySquares.toString();
                if (rowIdx !== 7)
                    positionString = positionString + "/";
            }
        });
    });
    return positionString;
}
function pieceToFen(piece) {
    return piece.color === "w" ? piece.type.toUpperCase() : piece.type;
}

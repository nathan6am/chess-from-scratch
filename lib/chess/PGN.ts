import { squareToCoordinates } from "./Chess";
import { Move, Position, FileEnum, HalfMove, FullMove, MoveHistory } from "./ChessTypes";
import _ from "lodash";
import { fenToGameState } from "./FenParser";

//Returns the PGN notation of a move given the move and the current position
export function moveToPgn(
  move: Omit<Move, "PGN">,
  position: Position,
  potentialMoves: Array<Move> | Array<Omit<Move, "PGN">> // Pass potential moves here to prevent from having to recalculate
): string {
  const piece = position.get(move.start);
  if (!piece) throw new Error("Invalid move or position");
  const color = piece.color;
  var notation = "";
  if (move.isCastle) {
    let coords = squareToCoordinates(move.end);
    if (coords[0] === 6 || coords[0] === 7) {
      notation = "O-O";
    } else {
      notation = "O-O-O";
    }
  } else {
    const type = piece.type;

    //Add notation for pawn moves, captures and promotions
    if (type === "p") {
      if (move.capture) {
        notation = FileEnum[squareToCoordinates(move.start)[0]] + "x" + move.end;
      } else {
        notation = move.end;
      }
      if (move.promotion) notation = `${notation}=${move.promotion.toUpperCase()}`;
    } else {
      //For non pawn moves, find potential ambiguous moves (pieces of the same type with the same end square)
      const ambiguousMoves = potentialMoves.filter((potentialMove) => {
        //filter out the original move
        if (_.isEqual(move, potentialMove)) return false;

        //only allow moves that end on the same square
        if (move.end !== potentialMove.end) return false;

        //filter out moves with a different piece type
        if (position.get(move.start)?.type !== position.get(potentialMove.start)?.type) return false;

        return true;
      });

      if (ambiguousMoves.length > 0) {
        notation = disambiguateMoves(move, position, ambiguousMoves);
      } else {
        notation = piece.type.toUpperCase();
      }

      if (move.capture) notation = notation + "x";
      notation = notation + move.end;
    }
  }
  if (move.isCheck && !move.isCheckMate) notation = notation + "+";
  if (move.isCheckMate) notation = notation + "#";

  return notation;
}

function disambiguateMoves(
  move: Move | Omit<Move, "PGN">,
  position: Position,
  alternateMoves: Array<Move> | Array<Omit<Move, "PGN">>
): string {
  const piece = position.get(move.start);
  if (!piece) throw new Error("Invalid move or position");
  let notation = piece.type.toUpperCase();

  //Attempt file disambiguation
  if (
    alternateMoves.every((altMove) => {
      let fileA = FileEnum[squareToCoordinates(move.start)[0]];
      let fileB = FileEnum[squareToCoordinates(altMove.start)[0]];
      return fileA !== fileB;
    })
  ) {
    return `${notation}${FileEnum[squareToCoordinates(move.start)[0]]}`;
  }
  //If file fails, attempt rank
  else if (
    alternateMoves.every((altMove) => {
      let rankA = squareToCoordinates(move.start)[1];
      let rankB = squareToCoordinates(altMove.start)[1];
      return rankA !== rankB;
    })
  ) {
    return `${notation}${squareToCoordinates(move.start)[1] + 1}`;
  } else {
    return `${notation}${move.start}`;
  }
}

//TODO: Export Game to PGN

//TODO: Pgn to Game Object

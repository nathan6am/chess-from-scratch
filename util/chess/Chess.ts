import {
  FileEnum,
  Piece,
  PieceType,
  Move,
  Square,
  Coordinates,
  Position,
  GameState,
  Color,
  MoveHistory,
  Outcome,
  HalfMove,
  Board,
} from "./ChessTypes";

import _ from "lodash";
import { trimMoveCounts, fenToGameState, gameStateToFen } from "./FenParser";
import { moveToPgn } from "./PGN";
/*---------------------------------------------------------
Type Definitions
---------------------------------------------------------*/

type MovementRule = {
  increment: [number, number];
  canCapture: boolean;
  captureOnly: boolean;
  range: number | null;
};

/*---------------------------------------------------------
Stringify coordinates to algebraic notation 
---------------------------------------------------------*/

export function squareToCoordinates(square: Square): Coordinates {
  const x = FileEnum[square.charAt(0) as keyof typeof FileEnum];
  const y = parseInt(square.charAt(1)) - 1;
  return [x, y];
}

export function toSquare(coordinates: Coordinates): Square {
  const [x, y] = coordinates;
  const rank = y + 1;
  const file = FileEnum[x];
  return `${file}${rank}` as Square;
}

/*---------------------------------------------------------
Piece Movement 
---------------------------------------------------------*/

//Given a piece and its starting square, generates a set of movement rules to evaluate potential moves

function getMovementRules(piece: Piece, start: Square): Array<MovementRule> {
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
        increment: increment as [number, number],
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
        increment: increment as [number, number],
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
        increment: increment as [number, number],
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
        increment: increment as [number, number],
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
        increment: increment as [number, number],
        canCapture: true,
        captureOnly: false,
        range: 1,
      }));

    default:
      throw new Error(`Type:${type} is not a valid piece type`);
  }
}

function evaluateRule(
  rule: MovementRule,
  position: Position,
  start: Square,
  enPassantTarget: Square | null = null
): {
  potentialMoves: Array<Move>;
  containsCheck: boolean;
  controlledSquares: Array<Square>;
} {
  const { increment, canCapture, captureOnly, range } = rule;
  const startingCoordinates = squareToCoordinates(start);

  const piece = position.get(start);
  if (!piece) throw new Error(`No piece at starting square ${start}}`);

  const activeColor = piece.color;

  //Initialize return variables
  var controlledSquares: Array<Square> = [];
  var potentialMoves: Array<Move> = [];
  var containsCheck = false;

  var currentCoordinates = startingCoordinates;
  var i = 0;
  const promotions = ["r", "q", "n", "b"];

  //loop as long as current coordinates are still on the board or the range is reached
  while (currentCoordinates.every((coord) => coord >= 0 && coord <= 7) && (!range || i < range)) {
    //increment by the rule values and make sure the resulting coordinates are still on the board
    currentCoordinates = currentCoordinates.map((coord, idx) => coord + increment[idx]) as [number, number];
    i++;
    if (!currentCoordinates.every((coord) => coord >= 0 && coord <= 7)) break;

    // check the square for pieces
    let currentSquare = toSquare(currentCoordinates);
    let isPromotion = piece.type === "p" && currentCoordinates[1] === (piece.color === "w" ? 7 : 0);
    if (position.has(currentSquare)) {
      //break if the piece is of the same color or the piece can't capture in the given direction
      if (position.get(currentSquare)?.color === activeColor) break;
      if (!canCapture) break;
      if (position.get(currentSquare)?.type === "k") {
        containsCheck = true;
      }
      if (isPromotion) {
        promotions.forEach((type) => {
          potentialMoves.push({
            start: start,
            end: toSquare(currentCoordinates),
            capture: toSquare(currentCoordinates),
            promotion: type as PieceType,
          });
        });
      } else {
        potentialMoves.push({
          start: start,
          end: toSquare(currentCoordinates),
          capture: toSquare(currentCoordinates),
        });
      }

      break;
    } else {
      // en passant capture
      if (toSquare(currentCoordinates) === enPassantTarget && piece.type === "p" && canCapture) {
        potentialMoves.push({
          start: start,
          end: toSquare(currentCoordinates),
          capture: toSquare([currentCoordinates[0], currentCoordinates[1] + (piece.color === "w" ? -1 : 1)]),
        });
      } else {
        controlledSquares.push(toSquare(currentCoordinates));
        if (!captureOnly) {
          if (isPromotion) {
            promotions.forEach((type) => {
              potentialMoves.push({
                start: start,
                end: toSquare(currentCoordinates),
                capture: null,
                promotion: type as PieceType,
              });
            });
          } else {
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
function isDoublePush(move: Move): boolean {
  const start = squareToCoordinates(move.start);
  const end = squareToCoordinates(move.end);
  const diff = Math.abs(end[1] - start[1]);
  return diff === 2;
}

//Returns the resulting en passant target from a double pawn push
function getTargetSquare(move: Move): Square {
  const start = squareToCoordinates(move.start);
  const end = squareToCoordinates(move.end);

  const direction = Math.abs(end[1] - start[1]) === end[1] - start[1] ? 1 : -1;

  return toSquare([start[0], start[1] + direction]);
}

export function getMaterialCount(position: Position): Record<Color, number> {
  const pieceValues: Record<PieceType, number> = {
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
    } else {
      b = b + pieceValues[piece.type];
    }
  }
  return { w, b };
}
//Determine if a give move results in a check
function moveIsCheck(game: GameState, move: Move): boolean {
  const { updatedGameState } = executeMove(game, move);
  const position = new Map(updatedGameState.position);
  const color = position.get(move.end)?.color as Color;

  for (let [square, piece] of position) {
    if (piece.color === color) {
      const rules = getMovementRules(piece, square);
      const check = rules.some((rule) => {
        const { containsCheck } = evaluateRule(rule, position, square);
        return containsCheck;
      });
      if (check) return true;
    }
  }
  return false;
}

//Returns false is a given move leaves the king in check

function verifyMove(move: Move, position: Position): boolean {
  //first determine the active color and execute the move);
  const piece = position.get(move.start);
  if (!piece) throw new Error("Invalid move: no piece exists on the starting square");
  const activeColor = piece.color;
  const endPosition = new Map(position);

  //delete the capture square
  if (move.capture !== null) endPosition.delete(move.capture);

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
      if (hasCheck) return false;
    }
  }
  return true;
}

//Returns an array of all the legal moves in a position
export function getMoves(game: GameState): Array<Move> {
  const { activeColor, position, enPassantTarget, castleRights } = game;

  const { kingSide, queenSide } = castleRights[activeColor];

  let moves: Array<Move> = [];
  let opponentControlledSquares: Array<Square> = [];

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
              moves.push({ ...move, isCheck });
            } else {
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
      moves.push({ ...move, isCheck });
    } else {
      moves.push(move);
    }
  });

  return moves;
}

//Return an array of the legal castling moves
function getCastles(game: GameState, opponentControlledSquares: Array<Square>): Array<Move> {
  const { activeColor, position, castleRights } = game;
  let moves: Array<Move> = [];
  let squares =
    activeColor === "w" ? { k: ["f1", "g1"], q: ["b1", "c1", "d1"] } : { k: ["f8", "g8"], q: ["b8", "c8", "d8"] };

  const { kingSide, queenSide } = castleRights[activeColor];
  if (!kingSide && !queenSide) {
    return moves;
  }

  if (
    kingSide &&
    squares.k.every((square) => {
      return !position.has(square as Square) && !opponentControlledSquares.includes(square as Square);
    })
  ) {
    moves.push({
      start: activeColor === "w" ? "e1" : "e8",
      end: activeColor === "w" ? "g1" : "g8",
      capture: null,
      isCastle: true,
    });
  }

  if (
    queenSide &&
    squares.q.every((square) => {
      return !position.has(square as Square) && !opponentControlledSquares.includes(square as Square);
    })
  ) {
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

export function executeMove(game: GameState, move: Move): { updatedGameState: GameState; capturedPiece: Piece | null } {
  const position = new Map(game.position);
  const piece = position.get(move.start);
  if (!piece) throw new Error("Invalid move");

  const capture = move.capture ? position.get(move.capture) || null : null;

  // Switch color and increment the move counters
  const activeColor: Color = game.activeColor === "w" ? "b" : "w";
  const fullMoveCount = game.fullMoveCount + (game.activeColor === "b" ? 1 : 0);
  //Reset half move count on a pawn push or capture
  const halfMoveCount = piece.type === "p" || move.capture !== null ? 0 : game.halfMoveCount + 1;
  var enPassantTarget: Square | null = null;

  const castleMap: Partial<Record<Square, [Square, Square]>> = {
    g1: ["h1", "f1"],
    c1: ["a1", "d1"],
    g8: ["h8", "f8"],
    c8: ["a8", "d8"],
  };

  var castleRights = { ...game.castleRights[game.activeColor] };

  if (move.isCastle) {
    let [start, end] = castleMap[move.end] as [Square, Square];
    let rook = position.get(start);
    if (!rook) throw new Error("Move is invalid.");
    position.set(end, rook);
    position.delete(start);
    position.set(move.end, piece);
    position.delete(move.start);

    //remove castle rights
    castleRights.kingSide = false;
    castleRights.queenSide = false;
  } else if (move.promotion) {
    if (move.capture) position.delete(move.capture);
    position.set(move.end, { ...piece, type: move.promotion });
    position.delete(move.start);
  } else {
    //remove the captured piece, execute the move
    if (move.capture) position.delete(move.capture);
    position.set(move.end, piece);
    position.delete(move.start);

    //Set the en passant target is the pawn is double pushed
    if (piece.type === "p" && isDoublePush(move)) {
      enPassantTarget = getTargetSquare(move);
    }

    //Remove corresponding castle rights on rook or king move
    if (piece.type === "r" && (castleRights.kingSide || castleRights.queenSide)) {
      const coords = squareToCoordinates(move.start);
      if (coords[1] === 7 && coords[0] === (activeColor === "w" ? 0 : 7)) castleRights.queenSide = false;
      if (coords[1] === 0 && coords[0] === (activeColor === "w" ? 0 : 7)) castleRights.kingSide = false;
    }
    if (piece.type === "k") {
      castleRights.kingSide = false;
      castleRights.queenSide = false;
    }
  }

  const updatedGame: GameState = {
    activeColor,
    position,
    enPassantTarget,
    halfMoveCount,
    fullMoveCount,
    castleRights: {
      ...game.castleRights,
      [game.activeColor]: castleRights,
    },
  };

  return {
    updatedGameState: updatedGame,
    capturedPiece: capture,
  };
}

export function testMove(game: GameState, move: Move): { updatedGameState: GameState; capturedPiece: Piece | null } {
  const position = new Map(game.position);
  const piece = position.get(move.start);
  if (!piece) throw new Error("Invalid move");

  const capture = move.capture ? position.get(move.capture) || null : null;

  // Switch color and increment the move counters
  const activeColor: Color = game.activeColor === "w" ? "b" : "w";
  const fullMoveCount = game.fullMoveCount + (game.activeColor === "b" ? 1 : 0);
  //Reset half move count on a pawn push or capture
  const halfMoveCount = piece.type === "p" || move.capture !== null ? 0 : game.halfMoveCount + 1;
  var enPassantTarget: Square | null = null;

  const castleMap: Partial<Record<Square, [Square, Square]>> = {
    g1: ["h1", "f1"],
    c1: ["a1", "d1"],
    g8: ["h8", "f8"],
    c8: ["a8", "f8"],
  };

  var castleRights = { ...game.castleRights[game.activeColor] };

  if (move.isCastle) {
    let [start, end] = castleMap[move.end] as [Square, Square];
    let rook = position.get(start);
    if (!rook) throw new Error("Move is invalid.");
    position.set(end, rook);
    position.delete(start);
    position.set(move.end, piece);
    position.delete(move.start);

    //remove castle rights
    castleRights.kingSide = false;
    castleRights.queenSide = false;
  } else if (move.promotion) {
    if (move.capture) position.delete(move.capture);
    position.set(move.end, { ...piece, type: move.promotion });
    position.delete(move.start);
  } else {
    //remove the captured piece, execute the move
    if (move.capture) position.delete(move.capture);
    position.set(move.end, piece);
    position.delete(move.start);

    //Set the en passant target is the pawn is double pushed
    if (piece.type === "p" && isDoublePush(move)) {
      enPassantTarget = getTargetSquare(move);
    }

    //Remove corresponding castle rights on rook or king move
    if (piece.type === "r" && (castleRights.kingSide || castleRights.queenSide)) {
      const coords = squareToCoordinates(move.start);
      if (coords[1] === 7 && coords[0] === (activeColor === "w" ? 0 : 7)) castleRights.queenSide = false;
      if (coords[1] === 0 && coords[0] === (activeColor === "w" ? 0 : 7)) castleRights.kingSide = false;
    }
    if (piece.type === "k") {
      castleRights.kingSide = false;
      castleRights.queenSide = false;
    }
  }

  const updatedGame: GameState = {
    activeColor,
    position,
    enPassantTarget,
    halfMoveCount,
    fullMoveCount,
    castleRights: {
      ...game.castleRights,
      [activeColor]: castleRights,
    },
  };

  return {
    updatedGameState: updatedGame,
    capturedPiece: capture,
  };
}
interface GameConfig {
  startPosition: string;
  timeControls: Array<TimeControl> | null;
  handicap?: Array<TimeControl>;
}

type TimeControl = {
  timeSeconds: number;
  incrementSeconds: number;
  moves?: number;
};

export interface Game extends Omit<GameState, "position"> {
  board: Board;
  moveHistory: MoveHistory;
  capturedPieces: Array<Piece>;
  legalMoves: Array<Move>;
  outcome: Outcome;
  config: GameConfig;
  lastMove: Move | null;
  fen: string;
}

export class Game implements Game {
  constructor(gameConfig: GameConfig) {
    const initialGameState = fenToGameState(gameConfig.startPosition);
    if (!initialGameState) throw new Error("Config is invalid: Invalid FEN passed to start position");
    const { castleRights, position, activeColor, halfMoveCount, fullMoveCount, enPassantTarget } = initialGameState;
    Object.assign(this, {
      castleRights,
      activeColor,
      halfMoveCount,
      fullMoveCount,
      enPassantTarget,
    });
    this.legalMoves = getMoves(initialGameState);
    this.moveHistory = [];
    this.capturedPieces = [];
    this.config = gameConfig;
    this.lastMove = null;
    this.board = positionToBoard(position);
    this.fen = gameConfig.startPosition;
  }
}

export function createGame(
  options: GameConfig = {
    startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    timeControls: null,
  }
): Game {
  const game = new Game(options);
  return game;
}

function isThreeFoldRepetition(moveHistory: MoveHistory, gameState: GameState): boolean {
  var repetitions = 0;
  const fenA = trimMoveCounts(gameStateToFen(gameState));
  moveHistory.forEach((fullMove) => {
    fullMove.forEach((move) => {
      if (!move) return;
      const fenB = trimMoveCounts(move.fen);

      if (fenA === fenB) repetitions = repetitions + 1;
    });
  });

  if (repetitions > 2) return true;
  return false;
}

//execute a move and return the updated game
export function move(game: Game, move: Move, elapsedTimeSeconds?: number): Game {
  var outcome = game.outcome;
  //verify the move is listed as one of the available moves
  const moveIsLegal = game.legalMoves.some((availableMove) => _.isEqual(move, availableMove));
  const updatedMoveHistory = Array.from(game.moveHistory);
  if (!moveIsLegal) throw new Error("Move is not in available moves");

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
  if (capturedPiece) capturedPieces.push(capturedPiece);

  // CHECK FOR GAME OUTCOMES

  //update the legal moves
  let updatedLegalMoves = getMoves(updatedGameState);

  //If there are no legal moves, result is checkmate or stalemate
  if (updatedLegalMoves.length === 0) {
    if (move.isCheck) {
      outcome = { result: activeColor, by: "checkmate" };

      //set move.isCheckmate for Move history/pgn
      move.isCheckMate = true;
    } else {
      outcome = { result: "d", by: "stalemate" };
    }
  }
  //TODO: Check for insufficient Material
  const { position: updatedPosition, ...rest } = updatedGameState;

  //Check for repitition
  if (isThreeFoldRepetition(game.moveHistory, updatedGameState)) {
    outcome = { result: "d", by: "repitition" };
  }

  //Check for 50 move rule
  if (updatedGameState.halfMoveCount >= 100) {
    outcome = { result: "d", by: "50-move-rule" };
  }

  const fen = gameStateToFen(updatedGameState);
  const updatedBoard = positionToBoard(updatedPosition);
  //Push to move history
  const halfMove: HalfMove = {
    move: move,
    PGN: moveToPgn(move, position, game.legalMoves),
    fen: gameStateToFen(updatedGameState),
    board: updatedBoard,
    elapsedTimeSeconds,
  };

  if (activeColor === "b") {
    const moveIdx = updatedMoveHistory.length - 1;
    updatedMoveHistory[moveIdx][1] = halfMove;
  } else {
    updatedMoveHistory.push([halfMove, null]);
  }

  //return the updated game
  const updatedGame: Game = {
    ...game,
    ...rest,
    board: updatedBoard,
    moveHistory: updatedMoveHistory,
    legalMoves: updatedLegalMoves,
    lastMove: move,
    capturedPieces,
    outcome,
    fen,
  };
  return updatedGame;
}

//export function takeback(game: Game): Game {}

export function exportPGN() {}

export function exportFEN() {}

export function serializeMoves(moves: Array<Move>): Array<String> {
  return moves.map(
    (move) =>
      `${move.start}:${move.end}:${move.capture || "-"}:${move.isCheck ? "+" : ""}${
        move.promotion ? ":=" + move.promotion : ""
      }`
  );
}
// export function deserializeMove(move: string): Move {
//   move.split(":")
// }

export function positionToBoard(position: Position): Board {
  return Array.from(position.entries());
}

function boardToPosition(board: Board): Position {
  return new Map(board);
}

export function getSquareColor(square: Square): Color {
  const coordinates = squareToCoordinates(square);
  const testColor = coordinates[0] % 2 === coordinates[1] % 2;
  return testColor ? "b" : "w";
}

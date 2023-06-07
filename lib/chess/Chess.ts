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
  NodeData,
  FullMove,
  Premove,
} from "./ChessTypes";

import _ from "lodash";
import { trimMoveCounts, fenToGameState, gameStateToFen } from "./FenParser";
import { moveToPgn } from "./PGN";
import { notEmpty } from "@/util/misc";

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

function preMovesByRule(rule: MovementRule, start: Square, position: Position) {
  const { increment, range } = rule;
  const startingCoordinates = squareToCoordinates(start);
  const piece = position.get(start);
  let premoves: Premove[] = [];
  if (!piece) return [];
  let currentCoordinates = startingCoordinates;
  let i = 0;
  const promotions = ["r", "q", "n", "b"];
  while (currentCoordinates.every((coord) => coord >= 0 && coord <= 7) && (!range || i < range)) {
    //increment by the rule values and make sure the resulting coordinates are still on the board
    currentCoordinates = currentCoordinates.map((coord, idx) => coord + increment[idx]) as [number, number];
    i++;
    if (!currentCoordinates.every((coord) => coord >= 0 && coord <= 7)) break;

    // check the square for pieces
    let currentSquare = toSquare(currentCoordinates);
    let isPromotion = piece.type === "p" && currentCoordinates[1] === (piece.color === "w" ? 7 : 0);
    if (isPromotion) {
      promotions.forEach((type) => {
        premoves.push({
          start,
          end: currentSquare,
          promotion: type as PieceType,
        });
      });
    } else {
      premoves.push({
        start,
        end: currentSquare,
      });
    }
  }
  return premoves;
}

function evaluateRule(
  rule: MovementRule,
  position: Position,
  start: Square,
  enPassantTarget: Square | null = null
): {
  potentialMoves: Array<Omit<Move, "PGN">>;
  containsCheck: boolean;
  controlledSquares: Array<Square>;
} {
  const { increment, canCapture, captureOnly, range } = rule;
  const startingCoordinates = squareToCoordinates(start);

  const piece = position.get(start);
  if (!piece) throw new Error(`No piece at starting square ${start}}`);

  const activeColor = piece.color;

  //Initialize return variables
  let controlledSquares: Array<Square> = [];
  let potentialMoves: Array<Omit<Move, "PGN">> = [];
  let containsCheck = false;

  let currentCoordinates = startingCoordinates;
  let i = 0;
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
function isDoublePush(move: Move | Omit<Move, "PGN">): boolean {
  const start = squareToCoordinates(move.start);
  const end = squareToCoordinates(move.end);
  const diff = Math.abs(end[1] - start[1]);
  return diff === 2;
}

//Returns the resulting en passant target from a double pawn push
function getTargetSquare(move: Move | Omit<Move, "PGN">): Square {
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
function getPieceCount(position: Position): Record<Color, Record<PieceType, number>> {
  let w: Record<PieceType, number> = {
    k: 0,
    n: 0,
    b: 0,
    p: 0,
    r: 0,
    q: 0,
  };
  let b: Record<PieceType, number> = {
    k: 0,
    n: 0,
    b: 0,
    p: 0,
    r: 0,
    q: 0,
  };
  for (let [square, piece] of position) {
    if (piece.color === "w") {
      w[piece.type]++;
    } else {
      b[piece.type]++;
    }
  }
  return { w, b };
}

//Determine if a give move results in a check
function moveIsCheck(game: GameState, move: Omit<Move, "PGN">): boolean {
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

function verifyMove(move: Move | Omit<Move, "PGN">, position: Position): boolean {
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

export function getPremoves(game: Game): Premove[] {
  const position = boardToPosition(game.board);
  const { activeColor, castleRights } = game;

  const preMoveColor = activeColor === "w" ? "b" : "w";
  const { kingSide, queenSide } = castleRights[preMoveColor];
  let premoves: Premove[] = [];
  for (let [start, piece] of position) {
    if (piece.color === preMoveColor) {
      const rules = getMovementRules(piece, start);
      rules.forEach((rule) => {
        const moves = preMovesByRule(rule, start, position);
        moves.forEach((premove) => {
          premoves.push(premove);
        });
      });
    }
  }
  if (kingSide) {
    premoves.push({
      start: preMoveColor === "w" ? "e1" : "e8",
      end: preMoveColor === "w" ? "g1" : "g8",
    });
    //King onto rook
    premoves.push({
      start: preMoveColor === "w" ? "e1" : "e8",
      end: preMoveColor === "w" ? "h1" : "h8",
    });
  }

  if (queenSide) {
    premoves.push({
      start: preMoveColor === "w" ? "e1" : "e8",
      end: preMoveColor === "w" ? "c1" : "c8",
    });
    premoves.push({
      start: preMoveColor === "w" ? "e1" : "e8",
      end: preMoveColor === "w" ? "a1" : "a8",
    });
  }
  return premoves;
}

/**
 * Get all the legal moves given current game stats
 * @param game current game state
 * @returns an array of the legal moves
 */
export function getMoves(game: GameState): Move[] {
  const { activeColor, position, enPassantTarget, castleRights } = game;

  const { kingSide, queenSide } = castleRights[activeColor];

  let moves: Omit<Move, "PGN">[] = [];
  let opponentControlledSquares: Square[] = [];

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

  return moves.map((move, idx, moves) => {
    const PGN = moveToPgn(move, game.position, moves);
    return { ...move, PGN: PGN };
  });
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
      PGN: "O-O",
    });
    //King onto rook support
    moves.push({
      start: activeColor === "w" ? "e1" : "e8",
      end: activeColor === "w" ? "h1" : "h8",
      capture: null,
      isCastle: true,
      PGN: "O-O",
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
      PGN: "O-O-O",
    });
    moves.push({
      start: activeColor === "w" ? "e1" : "e8",
      end: activeColor === "w" ? "a1" : "a8",
      capture: null,
      isCastle: true,
      PGN: "O-O-O",
    });
  }

  return moves;
}

//Executes as move, returns the updated game state and the captured piece

export function executeMove(
  game: GameState,
  move: Move | Omit<Move, "PGN">
): { updatedGameState: GameState; capturedPiece: Piece | null } {
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
    h1: ["h1", "f1"],
    c1: ["a1", "d1"],
    a1: ["a1", "d1"],
    g8: ["h8", "f8"],
    h8: ["h8", "f8"],
    c8: ["a8", "d8"],
    a8: ["a8", "d8"],
  };

  const destMap: Partial<Record<Square, Square>> = {
    g1: "g1",
    h1: "g1",
    c1: "c1",
    a1: "c1",
    g8: "g8",
    h8: "g8",
    c8: "c8",
    a8: "c8",
  };

  var castleRights = { ...game.castleRights[game.activeColor] };

  if (move.isCastle) {
    let [start, end] = castleMap[move.end] as [Square, Square];
    let rook = position.get(start);
    if (!rook) {
      console.log(move);
      console.log(game);
      throw new Error("Move is invalid.");
    }
    let dest = destMap[move.end];
    if (!dest) throw new Error("invalid end square for castles");
    position.set(end, rook);
    position.delete(start);
    position.set(dest, piece);
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

    //TODO: Bug fix - remove castling rights if corner rook is captured

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
  if (move.capture === "a8" || move.start === "a8") updatedGame.castleRights.b.queenSide = false;
  if (move.capture === "h8" || move.start === "h8") updatedGame.castleRights.b.kingSide = false;
  if (move.capture === "a1" || move.start === "a1") updatedGame.castleRights.w.queenSide = false;
  if (move.capture === "h1" || move.start === "h1") updatedGame.castleRights.w.kingSide = false;
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
    h1: ["h1", "f1"],
    c1: ["a1", "d1"],
    a1: ["a1", "d1"],
    g8: ["h8", "f8"],
    h8: ["h8", "f8"],
    c8: ["a8", "d8"],
    a8: ["a8", "d8"],
  };

  var castleRights = { ...game.castleRights[game.activeColor] };

  if (move.isCastle) {
    let [start, end] = castleMap[move.end] as [Square, Square];
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
  if (move.capture === "a8") updatedGame.castleRights.b.queenSide = false;
  if (move.capture === "h8") updatedGame.castleRights.b.kingSide = false;
  if (move.capture === "a1") updatedGame.castleRights.b.queenSide = false;
  if (move.capture === "h1") updatedGame.castleRights.b.kingSide = false;

  return {
    updatedGameState: updatedGame,
    capturedPiece: capture,
  };
}
export interface GameConfig {
  startPosition: string;
  timeControl: TimeControl | null;
}

export type TimeControl = {
  timeSeconds: number;
  incrementSeconds: number;
};

export type RatingCategory = "bullet" | "blitz" | "rapid" | "classical" | "puzzle" | "correspondence";

export type Rating = {
  rating: number;
  ratingDeviation: number;
  volatility: number;
  gameCount: number;
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

const defaultConfig: GameConfig = {
  startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  timeControl: null,
};
export function createGame(options: Partial<GameConfig>): Game {
  const config = {
    ...defaultConfig,
    ...options,
  };
  const game = new Game(config);
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
export function move(gameInitial: Game, move: Move, timeRemaining?: number): Game {
  const game = _.clone(gameInitial);
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
  const pieces = Array.from(updatedPosition.entries()).map(([square, piece]) => {
    return piece;
  });

  const whitePieces = pieces.filter((piece) => piece.color === "w");
  const blackPieces = pieces.filter((piece) => piece.color === "b");
  if (!isSufficientMaterial(whitePieces) && !isSufficientMaterial(blackPieces)) {
    outcome = {
      result: "d",
      by: "insufficient",
    };
  }
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
    board: injectTargets(updatedBoard, updatedLegalMoves),
    timeRemaining,
  };

  if (activeColor === "b") {
    const moveIdx = updatedMoveHistory.length - 1;
    const currentMove = updatedMoveHistory[moveIdx];
    if (!currentMove) {
      updatedMoveHistory[moveIdx] = [halfMove, halfMove];
    } else {
      updatedMoveHistory[moveIdx][1] = halfMove;
    }
  } else {
    updatedMoveHistory.push([halfMove, null]);
  }

  //return the updated game
  const updatedGame: Game = {
    ...game,
    ...rest,
    board: injectTargets(updatedBoard, updatedLegalMoves),
    moveHistory: updatedMoveHistory,
    legalMoves: updatedLegalMoves,
    lastMove: move,
    capturedPieces,
    outcome,
    fen,
  };
  return updatedGame;
}

function injectTargets(board: Board, legalMoves: Array<Move>): Board {
  const withTargets: Board = board.map((entry) => {
    const [square, piece] = entry;
    const targets = legalMoves.filter((move) => move.start === square).map((move) => move.end);
    return [square, { ...piece, targets }];
  });
  return withTargets;
}

export function isSufficientMaterial(pieces: Piece[]): boolean {
  if (pieces.some((piece) => piece.type === "p" || piece.type === "q" || piece.type === "r")) return true;
  let n = 0;
  let b = 0;
  pieces.forEach((piece) => {
    if (piece.type === "n") n++;
    if (piece.type === "b") b++;
  });
  if ((n && b) || n > 1 || b > 1) return true;
  return false;
}
export function positionToBoard(position: Position): Board {
  return Array.from(position.entries());
}

export function boardToPosition(board: Board): Position {
  return new Map(board);
}

export function getSquareColor(square: Square): Color {
  const coordinates = squareToCoordinates(square);
  const testColor = coordinates[0] % 2 === coordinates[1] % 2;
  return testColor ? "b" : "w";
}
export interface Analysis {
  rootPosition: string; // the root position as a fen string
  moves: Array<Node>; // annotated moves with recursive variations and eval caching
  metaData?: {
    event?: string;
    site?: string;
    date?: Date;
    round?: string;
    white?: string;
    black?: string;
    result?: string;
  };
}

//Create a new game object from a tree node and it's given line
export function gameFromNodeData(
  data: NodeData,
  startPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  moves?: Array<NodeData>
): Game {
  const board = data.board;
  const fen = data.fen;
  const game = createGame({ startPosition: fen, timeControl: null });
  let moveHistory: MoveHistory = [];

  //convert the line into move history
  if (moves) {
    const halfMoves = moves.map((node) => {
      const { uci, evaluation, halfMoveCount, comment, annotations, ...rest } = node;
      return { ...rest } as HalfMove;
    });

    const history = [];
    while (halfMoves.length > 0) history.push(halfMoves.splice(0, 2));

    moveHistory = history.map((fullmove) => {
      if (fullmove.length === 2) {
        return fullmove as FullMove;
      } else {
        return [fullmove[0], null] as FullMove;
      }
    });
  }
  return {
    ...game,
    board,
    moveHistory,
    lastMove: data.move,
    config: { ...game.config, startPosition },
  };
}

//Generate a new tree node from a halfmove
export function halfMoveToNode(halfMoveCount: number, halfMove: HalfMove): Omit<NodeData, "outcome"> {
  return {
    halfMoveCount,
    uci: MoveToUci(halfMove.move),
    comment: null,
    annotations: [],
    ...halfMove,
  };
}

export function MoveToUci(move: Move): string {
  return `${move.start}${move.end}${move.promotion ? move.promotion : ""}`;
}

export function nodeDataFromMove(game: Game, moveToExecute: Move, halfMoveCount: number): NodeData {
  const updatedGame = move(game, moveToExecute);
  const lastMove = updatedGame.moveHistory[updatedGame.moveHistory.length - 1];
  const lastHalfMove = lastMove[1] || lastMove[0];
  const partialNode = halfMoveToNode(halfMoveCount, lastHalfMove);
  return { ...partialNode, halfMoveCount, outcome: updatedGame.outcome };
}

export function moveCountToNotation(halfMoveCount: number): string {
  return `${Math.ceil(halfMoveCount / 2)}${halfMoveCount % 2 !== 0 ? ". " : "... "}`;
}

export function inferRatingCategeory(control: TimeControl | null): RatingCategory {
  if (!control) return "correspondence";
  if (control.timeSeconds < 60 * 3) return "bullet";
  if (control.timeSeconds < 60 * 10) return "blitz";
  if (control.timeSeconds < 60 * 30) return "rapid";
  if (control.timeSeconds) return "classical";
  return "correspondence";
}

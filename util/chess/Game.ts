import { getMoves, executeMove, getMaterialCount } from "./Chess";
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
} from "./ChessTypes";
import { moveToPgn } from "./PGN";
import { fenToGameState, gameStateToFen } from "./FenParser";
import _ from "lodash";

type halfMove = {
  move: Move;
  PGN: string;
  fen: string;
};

type FullMove = [halfMove, halfMove | null];
type MoveHistory = Array<FullMove>;

const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface GameInterface {
  readonly position: Position;
  readonly activeColor: Color;
  readonly availableMoves: Array<Move>;
  readonly moveHistory: MoveHistory;
  readonly fen: string;
  readonly result: Color | "draw" | null;
  readonly pgn?: {};
  readonly capturedPieces: Record<Color, Array<Piece>>;
  readonly materialCount: Record<Color, number>;
  resign: (color: Color) => void;
  move: (move: Move) => void;
}

//Check is a position has been repeated twice before in a game
function isThreeFoldRepetition(
  moveHistory: MoveHistory,
  gameState: GameState
): boolean {
  const positionString = gameStateToFen(gameState).split(" ")[0];

  const repetitions = moveHistory.filter((fullmove) => {
    return fullmove.some(
      (halfMove) => halfMove?.fen.split(" ")[0] === positionString
    );
  });

  if (repetitions.length >= 2) return true;
  return false;
}

export class Game implements GameInterface {
  private _gameState: GameState;
  private _capturedPieces: Array<Piece>;
  private _result: Color | "draw" | null;
  private _potentialMoves: Array<Move>;
  public moveHistory: MoveHistory;
  public fen: string;
  constructor(fen: string) {
    let gameState = fenToGameState(fen);
    if (!gameState) throw new Error("Starting position is invalid");
    this._gameState = gameState;
    this._capturedPieces = [];
    this._result = null;
    this._potentialMoves = getMoves(gameState);
    this.fen = fen;
    this.moveHistory = [];
  }

  public get position() {
    return this._gameState.position;
  }

  public get activeColor() {
    return this._gameState.activeColor;
  }
  public get capturedPieces() {
    return {
      w: this._capturedPieces.filter((piece) => piece.color === "w"),
      b: this._capturedPieces.filter((piece) => piece.color === "b"),
    };
  }

  public get materialCount() {
    return getMaterialCount(this._gameState.position);
  }
  public get availableMoves() {
    return getMoves(this._gameState);
  }
  public get result() {
    return this._result;
  }

  move(move: Move) {
    if (
      this.availableMoves.some((availableMove) =>
        _.isEqual(availableMove, move)
      )
    ) {
      const { game, capturedPiece } = executeMove(this._gameState, move);
      if (capturedPiece) this._capturedPieces.push(capturedPiece);
      let updatedMoves = getMoves(game);
      if (updatedMoves.length === 0) {
        if (move.isCheck) {
          this._result = this._gameState.activeColor;
        } else {
          this._result = "draw";
        }
      }

      if (isThreeFoldRepetition(this.moveHistory, game)) {
        this._result = "draw";
      }

      const halfMove = {
        move,
        PGN: moveToPgn(move, this._gameState.position, this._potentialMoves),
        fen: gameStateToFen(game),
      };
      if (this._gameState.activeColor === "w") {
        this.moveHistory.push([halfMove, null]);
      } else {
        this.moveHistory[this.moveHistory.length][1] = halfMove;
      }
      this._gameState = game;
      console.log(gameStateToFen(this._gameState));
      this._potentialMoves = updatedMoves;
    } else {
      throw new Error("Attempted to make invalid move");
    }
  }
  resign(color: Color) {
    this._result = color === "w" ? "b" : "w";
  }
}

const testGame = new Game(startFen);

testGame.move(testGame.availableMoves[9]);

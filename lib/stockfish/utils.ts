import * as Chess from "@/lib/chess";
import _ from "lodash";
export interface EvalOptions {
  useCloudEval: boolean;
  depth: number;
  useNNUE: boolean;
  multiPV: number;
  showLinesAfterDepth: number;
}
interface EvalScoreRaw {
  type: "cp" | "mate" | "lowerbound" | "upperbound";
  value: number;
}
export interface EvalScore {
  type: "cp" | "mate";
  value: number;
}
export interface InfoMessageData {
  depth: number;
  multiPV: number;
  score: EvalScoreRaw;
  seldepth: number;
  nodes?: number;
  time: number;
  nps?: number;
  hashfull?: number;
  pv: string[];
}

export interface Line {
  score: EvalScore;
  moves: UCIMove[];
}

export interface UCIMove {
  start: Chess.Square;
  end: Chess.Square;
  promotion?: Chess.PieceType;
}

//Remove En Passant target if it is not a legal move
export function formatFen(fen: string): string {
  const game = Chess.createGame({ startPosition: fen });
  if (!game.legalMoves.some((move) => move.capture && move.end === game.enPassantTarget)) {
    const args = fen.split(" ");
    args[3] = "-";
    return (fen = args.join(" "));
  }
  return fen;
}

export function parseInfoMessage(params: string[]): InfoMessageData {
  const values = [
    "depth",
    "multipv",
    "score",
    "seldepth",
    "time",
    "nodes",
    "nps",
    "time",
    "pv",
    "hashfull",
  ];
  let reading = "";
  let evaluation: InfoMessageData = {
    depth: 0,
    multiPV: 1,
    score: {
      type: "cp",
      value: 0,
    },
    time: 0,
    seldepth: 0,
    pv: [],
  };
  //Assign args to values
  params.forEach((param) => {
    if (values.includes(param)) {
      reading = param;
    } else {
      switch (reading) {
        case "depth":
          evaluation.depth = parseInt(param);
          break;
        case "multipv":
          evaluation.multiPV = parseInt(param);
          break;
        case "seldepth":
          evaluation.seldepth = parseInt(param);
          break;
        case "score":
          if (
            param === "cp" ||
            param === "mate" ||
            param === "upperbound" ||
            param === "lowerbound"
          ) {
            evaluation.score.type = param;
          } else {
            evaluation.score.value = parseInt(param);
          }
          break;
        case "time":
          evaluation.time = parseInt(param);
          break;
        case "nps":
          evaluation.nps = parseInt(param);
          break;
        case "hashfull":
          evaluation.hashfull = parseInt(param);
          break;
        case "pv":
          evaluation.pv.push(param);
          break;
        default:
          break;
      }
    }
  });
  return evaluation;
}

export function parseUciMove(uci: string): UCIMove {
  const args: string[] = uci.trim().match(/.{1,2}/g) || [];
  if (!args[0] || ![args[1]]) throw new Error("invalid uci move");
  let move: UCIMove = {
    start: args[0] as Chess.Square,
    end: args[1] as Chess.Square,
  };
  if (args[2]) move.promotion = args[2] as Chess.PieceType;
  return move;
}

//Converts a variation to a line object with score
export function pvToLine(pv: { cp?: number; mate?: number; moves: string }): Line {
  if (pv.cp === undefined && pv.mate === undefined) throw new Error("Invalid pv object");
  if (!(pv.cp || pv.cp === 0) && !(pv.mate || pv.mate === 0)) throw new Error("Invalid pv object");
  const score: EvalScore =
    pv.cp || pv.cp === 0 ? { type: "cp", value: pv.cp } : { type: "mate", value: pv.mate || 0 };
  const moves = pv.moves.split(" ").map((move) => parseUciMove(move));
  return {
    score,
    moves,
  };
}

export function uciMovesToPgn(moves: UCIMove[], fen: string): string[] {
  const game = Chess.createGame({ startPosition: fen });
  const result: string[] = [];
  try {
    let currentGame = _.cloneDeep(game);
    moves.forEach((uciMove) => {
      const move = currentGame.legalMoves.find(
        (move) =>
          move.start === uciMove.start &&
          move.end === uciMove.end &&
          move.promotion === uciMove.promotion
      );
      if (!move) {
        return result;
      } else {
        result.push(move.PGN);
        const nextGame = Chess.move(currentGame, move);
        currentGame = nextGame;
      }
    });
    return result;
  } catch (e) {
    console.error(e);
    return [];
  }
}

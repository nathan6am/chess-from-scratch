import * as Chess from "@/lib/chess";
export interface EvalOptions {
  useCloudEval: boolean;
  depth: number;
  useNNUE: boolean;
  multiPV: number;
  showLinesAfterDepth: number;
  showEvalBar: boolean;
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
  pv: UCIMove[];
}

export interface UCIMove {
  start: Chess.Square;
  end: Chess.Square;
  promotion?: Chess.PieceType;
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
export function parseInfoMessage(data: string): InfoMessageData {
  const args: string[] = data.trim().split(" ");
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
  args.forEach((arg) => {
    if (values.includes(arg)) {
      reading = arg;
    } else {
      switch (reading) {
        case "depth":
          evaluation.depth = parseInt(arg);
          break;
        case "multipv":
          evaluation.multiPV = parseInt(arg);
          break;
        case "seldepth":
          evaluation.seldepth = parseInt(arg);
          break;
        case "score":
          if (arg === "cp" || arg === "mate" || arg === "upperbound" || arg === "lowerbound") {
            evaluation.score.type = arg;
          } else {
            evaluation.score.value = parseInt(arg);
          }
          break;
        case "time":
          evaluation.time = parseInt(arg);
          break;
        case "nps":
          evaluation.nps = parseInt(arg);
          break;
        case "hashfull":
          evaluation.hashfull = parseInt(arg);
          break;
        case "pv":
          evaluation.pv.push(parseUciMove(arg));
          break;
        default:
          break;
      }
    }
  });
  return evaluation;
}

import { Square, PieceType, Move } from "./ChessTypes";

export function initialize(stockfish: Worker) {
  stockfish.postMessage("uci");
}

export function limitStrength(value: boolean, stockfish: Worker) {
  stockfish.postMessage(`setoption name UCI_LimitStrength value ${value}`);
}

export function setSkillLevel(value: number, stockfish: Worker) {
  if (value < 0 || value > 20)
    throw new Error(
      `Value: ${value} is outside the range for option SkillLevel - please enter a value between 0 and 20`
    );
  stockfish.postMessage(`setoption name Skill Level value ${value}`);
}

export async function ready(stockfish: Worker): Promise<boolean> {
  console.log("starting");
  let timer: NodeJS.Timeout;
  const isReady = new Promise<boolean>((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      console.log(e.data);
      if (e.data === "readyok") {
        console.log("ready");
        clearTimeout(timer);
        stockfish.removeEventListener("message", handler);
        resolve(true);
      }
    };
    stockfish.addEventListener("message", handler);
    stockfish.postMessage("isready");
    stockfish.postMessage("uci");
    timer = setTimeout(() => {
      stockfish.removeEventListener("message", handler);
      reject(new Error("timeout waiting for response on command `uci`"));
    }, 200000);
  });

  const ready = await isReady;
  return ready;
}

export async function startup(stockfish: Worker) {
  const isReady = await ready(stockfish);
  let timer: NodeJS.Timeout;
  if (isReady) {
    const getOptions = new Promise((resolve, reject) => {
      let options: any[] = [];
      const handler = (e: MessageEvent) => {
        const args = e.data.split(" ");
        if (args[0] === "option") {
          let reading = "";
          let name = "";
          let type = "";
          let defaultValue = "";
          args.forEach((arg: string) => {
            if (arg === "name" || arg === "type" || arg === "default") {
              reading = arg;
            } else {
              switch (reading) {
                case "name":
                  if (name.length >= 1) name = name + " " + arg;
                  else name = arg;
                  break;
                case "type":
                  type = arg;
                  break;
                case "default":
                  if (defaultValue.length >= 1) defaultValue = defaultValue + " " + arg;
                  else defaultValue = arg;
                  break;
                default:
                  break;
              }
            }
          });
          options.push({ name, type, defaultValue });
        } else if (args[0] === "uciok") {
          clearTimeout(timer);
          stockfish.removeEventListener("message", handler);
          resolve(options);
        }
      };
      stockfish.addEventListener("message", handler);
      stockfish.postMessage("uci");
      timer = setTimeout(() => {
        stockfish.removeEventListener("message", handler);
        reject(new Error("timeout waiting for response on command `uci`"));
      }, 200000);
    });

    const options = await getOptions;
    return {
      ready: true,
      options,
    };
  }
}

interface EvalOptions {
  depth: number;
  fen: string;
  useNNUE: boolean;
  multiPV: number;
}

export interface EvalInfo {
  depth: number;
  multiPV: number;
  score: {
    type: "cp" | "mate" | "lowerbound" | "upperbound";
    value: number;
  };
  seldepth: number;
  nodes?: number;
  time: number;
  nps?: number;
  hashfull?: number;
  pv: string[];
}

//Convert UCI info message into evaluation object
function parseEvalInfo(args: string[]): EvalInfo {
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
  let evaluation: EvalInfo = {
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
          evaluation.pv.push(arg);
          break;
        default:
          break;
      }
    }
  });
  return evaluation;
}

export interface PartialEval {
  score: { type: "cp" | "mate"; value: number };
  depth: number;
  bestMove?: UCIMove;
}
export type UCIMove = {
  start: Square;
  end: Square;
  promotion?: PieceType;
};

export interface EvalScore {
  type: "cp" | "mate";
  value: number;
}
export interface Variation {
  score: { type: "cp" | "mate"; value: number };
  moves: string[];
}
export interface Line {
  score: { type: "cp" | "mate"; value: number };
  moves: UCIMove[];
}
export interface FinalEvaluation {
  score: { type: "cp" | "mate"; value: number };
  lines: Line[];
  depth: number;
  bestMove: UCIMove;
  time: number;
  isCloud?: boolean;
}
export async function getEvaluation(
  evaler: Worker,
  options: EvalOptions = { depth: 10, fen: "", useNNUE: false, multiPV: 3 },
  callback: (patialEval: PartialEval) => void
): Promise<FinalEvaluation> {
  const stockfish = evaler;
  let info: EvalInfo;
  let timer: NodeJS.Timeout;
  let multiPVs: Variation[] = [];
  const evaluation = new Promise<FinalEvaluation>((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      if (!e.data) return;
      const args: string[] = e.data.split(" ");
      const multiplier = options.fen.split(" ")[1] === "w" ? 1 : -1;
      //Ignore some unnecessary messages
      if (args[0] === "info" && !(args.includes("string") || args.includes("currmove"))) {
        const evalInfo = parseEvalInfo(args);
        evalInfo.score.value = evalInfo.score.value * multiplier;
        if (evalInfo.score.type !== "lowerbound" && evalInfo.score.type !== "upperbound") {
          const score = {
            type: evalInfo.score.type as unknown as "cp" | "mate",
            value: evalInfo.score.value,
          };
          if (evalInfo.multiPV === 1) {
            info = evalInfo;
            callback({
              score,
              depth: evalInfo.depth,
              bestMove: evalInfo.pv[0] ? parseUciMove(evalInfo.pv[0]) : undefined,
            });
          }
          multiPVs[evalInfo.multiPV - 1] = { score, moves: evalInfo.pv };
        }
      }

      if (args[0] === "bestmove") {
        clearTimeout(timer);
        stockfish.removeEventListener("message", handler);
        if (info.depth !== options.depth) {
          reject("depth not reached");
        }
        const finalEval: FinalEvaluation = {
          lines: multiPVs.map((variation) => ({
            ...variation,
            moves: variation.moves.map((uci) => parseUciMove(uci)),
          })),
          score: {
            type: info.score.type as unknown as "cp" | "mate",
            value: info.score.value,
          },
          bestMove: parseUciMove(args[1]),
          depth: info.depth,
          time: info.time,
        };
        resolve(finalEval);
      }
    };
    stockfish.addEventListener("message", handler);
    stockfish.postMessage(`setoption name Use NNUE value ${options.useNNUE}`);
    stockfish.postMessage("setoption name UCI_AnalyseMode value true");
    stockfish.postMessage("setoption name MultiPV value " + options.multiPV);
    stockfish.postMessage("position fen " + options.fen);
    stockfish.postMessage("go depth " + options.depth);
    stockfish.postMessage("eval");
    timer = setTimeout(() => {
      stockfish.removeEventListener("message", handler);
      reject(new Error("timeout waiting for response on command `evaluation`"));
    }, 400000);
  });

  const final = await evaluation;
  return final;
}

export function parseUciMove(uci: string): UCIMove {
  const args: string[] = uci.trim().match(/.{1,2}/g) || [];
  if (!args[0] || ![args[1]]) throw new Error("invalid uci move");
  let move: UCIMove = {
    start: args[0] as Square,
    end: args[1] as Square,
  };
  if (args[2]) move.promotion = args[2] as PieceType;
  return move;
}

export async function stop(stockfish: Worker, timeout?: number) {
  let timer: NodeJS.Timeout;
  const stop = new Promise<boolean>((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      const args = e.data.split(" ");
      if (args[0] === "bestmove") {
        //clear timeout on correct response
        clearTimeout(timer);
        stockfish.removeEventListener("message", handler);
        resolve(true);
      }
    };
    stockfish.addEventListener("message", handler);
    stockfish.postMessage("stop");
    timer = setTimeout(() => {
      stockfish.removeEventListener("message", handler);
      reject(new Error("timeout waiting for response on command `stop`"));
    }, timeout || 20000);
  });
  const stopped = await stop;
  return stopped;
}

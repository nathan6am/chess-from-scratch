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
const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 10000));

export async function ready(stockfish: Worker) {
  const isReady = new Promise((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      if (e.data === "readyok") {
        stockfish.removeEventListener("message", handler);
        resolve(true);
      }
    };
    stockfish.addEventListener("message", handler);
    stockfish.postMessage("isready");
  });

  const ready = await Promise.race([isReady, timeout]);
  return ready;
}

export async function startup(stockfish: Worker) {
  const isReady = await ready(stockfish);
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
          stockfish.removeEventListener("message", handler);
          resolve(options);
        }
      };
      stockfish.addEventListener("message", handler);
      stockfish.postMessage("uci");
    });

    const options = await Promise.race([getOptions, timeout]);
    if (options) {
      return {
        ready: true,
        options,
      };
    } else {
      throw new Error("something went wrong");
    }
  } else {
    throw new Error("engine timeout");
  }
}

interface EvalOptions {
  depth: number;
  fen: string;
  useNNUE: boolean;
}

export interface Evaluation {
  depth: number;
  multipv: number;
  score: {
    type: "cp" | "mate" | "lowerbound" | "upperbound";
    value: number;
  };
  seldepth: number;
  nodes?: number;
  time?: number;
  nps?: number;
  hashfull?: number;
  pv: string[];
}

//Conver UCI info message into evaluation object
function parseEvalInfo(args: string[]): Evaluation {
  const values = ["depth", "multipv", "score", "seldepth", "time", "nodes", "nps", "time", "pv", "hashfull"];
  let reading = "";
  let evaluation: Evaluation = {
    depth: 0,
    multipv: 1,
    score: {
      type: "cp",
      value: 0,
    },
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
          evaluation.multipv = parseInt(arg);
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

export async function getEvaluation(
  evaler: Worker,
  options: EvalOptions = { depth: 10, fen: "", useNNUE: false },
  callback: (evaluation: Evaluation) => void
) {
  const stockfish = evaler;
  let result: any;
  let timer: NodeJS.Timeout;
  const evaluation = new Promise((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      if (!e.data) return;
      const args: string[] = e.data.split(" ");
      const multiplier = options.fen.split(" ")[1] === "w" ? 1 : -1;
      //Ignore some unnecessary messages
      if (args[0] === "info" && !(args.includes("string") || args.includes("currmove"))) {
        const evaluation = parseEvalInfo(args);
        evaluation.score.value = evaluation.score.value * multiplier;
        if (evaluation.score.type !== "lowerbound" && evaluation.score.type !== "upperbound") {
          result = evaluation;
          callback(evaluation);
        }
      }

      if (args[0] === "bestmove") {
        clearTimeout(timer);
        stockfish.removeEventListener("message", handler);
        if (!result) reject("Evaluation error");
        if (result) resolve(result);
      }
      if (args[0] === "bestmove" && result?.depth === options.depth) {
      }
    };
    stockfish.addEventListener("message", handler);
    stockfish.postMessage(`setoption name Use NNUE value ${options.useNNUE}`);
    stockfish.postMessage("setoption name UCI_AnalyseMode value true");
    stockfish.postMessage("position fen " + options.fen);
    stockfish.postMessage("go depth " + options.depth);
    stockfish.postMessage("eval");
    timer = setTimeout(() => {
      stockfish.removeEventListener("message", handler);
      reject(new Error("timeout waiting for response on command `evaluation`"));
    }, 120000);
  });

  const final = await evaluation;
  return final;
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
    }, timeout || 10000);
  });
  const stopped = await stop;
  return stopped;
}

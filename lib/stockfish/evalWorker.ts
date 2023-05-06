import * as Chess from "../chess";
import axios from "axios";
import _, { debounce } from "lodash";
import {
  EvalScore,
  UCIMove,
  EvalOptions,
  parseInfoMessage,
  parseUciMove,
  pvToLine,
  Line,
  uciMovesToPgn,
  formatFen,
} from "./utils";

interface Message {
  type: "evaluateFen" | "staticEval" | "abort" | "setOptions" | "disable" | "enable";
  fen?: string;
  options?: EvalOptions;
}
export interface MessageResponse {
  type: "finalEval" | "updateScore" | "updateLine";
  eval?: Evaluation;
  score?: EvalScore;
  line?: Variation;
  depth?: number;
  move?: string;
  fen?: string;
  index?: number;
}

interface Evaluation {
  fen: string;
  depth: number;
  score: EvalScore;
  move: string;
  lines: Array<{
    score: EvalScore;
    moves: string[];
  }>;
  isCloudEval?: boolean;
}

interface CloudEval {
  depth: number;
  fen: string;
  knodes: number;
  pvs: Array<{ cp?: number; mate?: number; moves: string }>;
}

export interface Variation {
  score: EvalScore;
  moves: string[];
}

const cache = new Map<string, Evaluation>();

function normalizeFen(fen: string): string {
  //remove fullMoveNumber and halfMoveClock
  const fenParts = fen.split(" ");
  return fenParts.slice(0, 4).join(" ");
}

//Converts a cloud eval to a local eval
function convertCloudEval(cloudEval: CloudEval, activeColor: Chess.Color, fen: string): Evaluation {
  if (!cloudEval.pvs.length) throw new Error("No lines");

  const lines = cloudEval.pvs
    .map((pv) => pvToLine(pv))
    .map((line) => ({ score: line.score, moves: uciMovesToPgn(line.moves, fen) }));
  lines.sort((lineA, lineB) => {
    const scoreA = lineA.score;
    const scoreB = lineB.score;
    if (scoreA.type === "mate" && scoreB.type === "mate") {
      if (activeColor === "w") return scoreA.value - scoreB.value;
      return scoreB.value - scoreA.value;
    } else if (scoreA.type === "mate" || scoreB.type === "mate") {
      if (scoreA.type === "mate" && scoreA.value < 0) return activeColor === "w" ? 1 : -1;
      if (scoreA.type === "mate" && scoreA.value >= 0) return activeColor === "w" ? -1 : 1;
      if (scoreA.type === "cp" && scoreB.value < 0) return activeColor === "w" ? -1 : 1;
      return activeColor === "w" ? 1 : -1;
    } else {
      if (activeColor === "w") return scoreB.value - scoreA.value;
      return scoreA.value - scoreB.value;
    }
  });

  const move = lines[0].moves[0];
  const score = lines[0].score;
  return {
    fen,
    lines,
    depth: cloudEval.depth,
    isCloudEval: true,
    move,
    score,
  };
}
const wasmSupported =
  typeof WebAssembly === "object" &&
  WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
const stockfish = new Worker(
  wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js"
);

let aborted = false;
let ready = false;
let evaluating = false;
let currentFen: string | null = null;
let currentScore: EvalScore = { type: "cp", value: 0 };
let currentDepth = 0;
let currentMove: string | null = null;
let currentLines: Variation[] = [];
let game = null;

let options: EvalOptions = {
  useNNUE: true,
  useCloudEval: true,
  //threads: 2,
  multiPV: 3,
  depth: 18,
  showLinesAfterDepth: 10,
};
//Startup
stockfish.postMessage("uci");
stockfish.postMessage("isready");
function shouldReevaluate(newOptions: EvalOptions): boolean {
  if (newOptions.useCloudEval !== options.useCloudEval) return true;
  if (newOptions.useNNUE !== options.useNNUE) return true;
  if (newOptions.multiPV > options.multiPV) return true;
  if (newOptions.depth > options.depth) return true;
  //if (newOptions.threads > options.threads) return true;
  return false;
}

const onStockfishMessage = (e: MessageEvent) => {
  const message = e.data;
  const params = message.split(" ");
  if (params[0] === "readyok") {
    ready = true;
  }
  if (!currentFen) return;
  if (params[0] === "info" && !(params.includes("string") || params.includes("currmove"))) {
    if (aborted) {
      aborted = false;
      return;
    }
    const info = parseInfoMessage(params);
    if (!info) return;
    if (info.score.type === "lowerbound" || info.score.type === "upperbound") return;
    const scoreMultiplier = currentFen && currentFen.includes("w") ? 1 : -1;
    if (info.score.type === "mate") console.log(info.score);
    info.score.value *= scoreMultiplier;
    if (info.multiPV === 1) {
      currentScore = info.score as EvalScore;
      currentDepth = info.depth;
      currentMove = info.pv[0];
      self.postMessage({
        type: "updateScore",
        fen: currentFen,
        score: info.score as EvalScore,
        depth: info.depth,
        move: info.pv[0],
      });
    }
    if (info.depth >= options.showLinesAfterDepth) {
      const line = {
        score: info.score as EvalScore,
        moves: uciMovesToPgn(
          info.pv.map((move) => parseUciMove(move)),
          currentFen
        ),
      };
      const index = info.multiPV - 1;
      currentLines[index] = line;
      self.postMessage({ type: "updateLine", fen: currentFen, line, index });
    }
  } else if (params[0] === "bestmove") {
    if (aborted) {
      aborted = false;
      return;
    }
    if (currentDepth < options.depth) return;
    const evaluation: Evaluation = {
      fen: currentFen,
      lines: currentLines,
      depth: currentDepth,
      isCloudEval: false,
      move: currentMove || "",
      score: currentScore,
    };
    cache.set(normalizeFen(currentFen), evaluation);
    self.postMessage({ type: "finalEval", eval: evaluation });
  }
};

//Register event listener
stockfish.addEventListener("message", onStockfishMessage);

const runEval = debounce(async (fen: string) => {
  console.log("running eval");
  abort();
  currentFen = fen;
  const cached = getCachedEval(fen);
  if (cached) {
    if (!cached.isCloudEval && options.useCloudEval) {
      console.log("here");
      const cloudEval = await fetchCloudEval(fen);
      if (cloudEval) {
        cache.set(normalizeFen(fen), cloudEval);
        self.postMessage({ type: "finalEval", eval: cloudEval });
        return;
      }
    }
    self.postMessage({ type: "finalEval", eval: cached });
    return;
  } else if (options.useCloudEval) {
    const cloudEval = await fetchCloudEval(fen);
    if (cloudEval) {
      cache.set(normalizeFen(fen), cloudEval);
      self.postMessage({ type: "finalEval", eval: cloudEval });

      return;
    }
  }
  evaluating = true;
  //stockfish.postMessage("setoption name Threads value " + options.threads);
  stockfish.postMessage("setoption name MultiPV value " + options.multiPV);
  stockfish.postMessage("setoption name UCI_AnalyseMode value true");
  stockfish.postMessage("position fen " + fen);
  if (options.depth === -1) stockfish.postMessage("go infinite");
  else stockfish.postMessage("go depth " + options.depth);
}, 500);
self.onmessage = async (e: MessageEvent) => {
  const message: Message = e.data;
  if (message.type === "evaluateFen") {
    const fen = message.fen;
    if (!fen) return;
    if (fen === currentFen) return;
    runEval(fen);
  }
  if (message.type === "disable") {
    console.log("disabling confirmed");
    abort();
  }
  if (message.type === "enable") {
    if (currentFen) runEval(currentFen);
  }
  if (message.type === "setOptions") {
    const newOptions = message.options;
    console.log("new options", newOptions);
    if (!newOptions) return;
    if (shouldReevaluate(newOptions)) {
      options = { ...options, ...newOptions };
      if (currentFen) runEval(currentFen);
    } else {
      options = { ...options, ...newOptions };
    }
  }
};

function abort() {
  aborted = true;
  stockfish.postMessage("stop");
  console.log("aborting");
  currentMove = null;
  currentLines = [];
  currentScore = { type: "cp", value: 0 };
  currentDepth = 0;
}

function getCachedEval(fen: string): Evaluation | null {
  const normalizedFen = normalizeFen(fen);
  const cached = cache.get(normalizedFen);
  if (cached) {
    if (
      (cached.isCloudEval && !options.useCloudEval) ||
      cached.depth < options.depth ||
      cached.lines.length < options.multiPV
    ) {
      cache.delete(normalizedFen);
      return null;
    }
    return cached;
  }
  return null;
}

async function fetchCloudEval(fen: string): Promise<Evaluation | null> {
  const formatted = formatFen(fen);
  try {
    const res = await axios.get("https://lichess.org/api/cloud-eval", {
      params: {
        fen: formatted,
        multiPv: options.multiPV,
      },
    });

    if (res.status === 200 && res.data) {
      const activeColor = fen.split(" ")[1] as Chess.Color;
      const cloudEval: CloudEval = res.data;
      const evaluation = convertCloudEval(cloudEval, activeColor, fen);
      return evaluation;
    }
    return null;
  } catch (e) {
    return null;
  }
}

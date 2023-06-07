import { time } from "console";
import * as Chess from "../chess";
const wasmSupported =
  typeof WebAssembly === "object" && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
const stockfish = new Worker(wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js");

interface StockfishOptions {
  useNNUE: boolean;
  uciLimitStrength: boolean;
  uciElo: number;
  threads: number;
  hash: number;
  skillLevel: number;
}

interface EngineGameConfig extends Chess.GameConfig {
  playerColor: "w" | "b";
  options: StockfishOptions;
  depth: number | "auto";
}

let defaultOptions: StockfishOptions = {
  useNNUE: true,
  uciLimitStrength: false,
  uciElo: 2800,
  threads: 2,
  hash: 128,
  skillLevel: 20,
};

const PRESETS: { [key: number]: StockfishOptions } = {
  1: { ...defaultOptions, uciLimitStrength: true, uciElo: 1000, skillLevel: 0 },
  2: { ...defaultOptions, uciLimitStrength: true, uciElo: 1200, skillLevel: 5 },
  3: { ...defaultOptions, uciLimitStrength: true, uciElo: 1400, skillLevel: 10 },
  4: { ...defaultOptions, uciLimitStrength: true, uciElo: 1600, skillLevel: 12 },
  5: { ...defaultOptions, uciLimitStrength: true, uciElo: 1800, skillLevel: 15 },
  6: { ...defaultOptions, uciLimitStrength: true, uciElo: 2000, skillLevel: 18 },
  7: { ...defaultOptions, uciLimitStrength: true, uciElo: 2200, skillLevel: 19 },
  8: { ...defaultOptions, uciLimitStrength: true, uciElo: 2400, skillLevel: 20 },
  9: { ...defaultOptions, uciLimitStrength: true, uciElo: 2700, skillLevel: 20 },
  10: { ...defaultOptions, uciLimitStrength: false, uciElo: 3200, skillLevel: 20 },
};

let ready = false;
let config: EngineGameConfig = {
  startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  timeControl: null,
  playerColor: "w",
  options: defaultOptions,
  depth: "auto",
};

interface Message {
  type: "move" | "newGame" | "abort";
  moves?: string[];
  fen?: string;
  config?: EngineGameConfig;
  timeRemaining?: Record<Chess.Color, number>;
}
const stockfishMessageHandler = (e: MessageEvent<string>) => {
  const message = e.data;
  const params = message.split(" ");
  if (params[0] === "readyok") {
    ready = true;
    self.postMessage({ type: "ready" });
  }
  if (params[0] === "bestmove") {
    const move = params[1];
    self.postMessage({ type: "move", move });
  }
};

stockfish.addEventListener("message", stockfishMessageHandler);
stockfish.postMessage("uci");
stockfish.postMessage("isready");

self.onmessage = (event: MessageEvent<Message>) => {
  const message = event.data;
  if (message.type === "newGame") {
    if (!message.config) return;
    config = message.config;
    stockfish.postMessage(`setoption name Skill Level value ${config.options.skillLevel}`);
    stockfish.postMessage(`setoption name Threads value ${config.options.threads}`);
    stockfish.postMessage(`setoption name Hash value ${config.options.hash}`);
    stockfish.postMessage(`setoption name UCI_Elo value ${config.options.uciElo}`);
    stockfish.postMessage(`setoption name UCI_LimitStrength value ${config.options.uciLimitStrength}`);
    stockfish.postMessage(`setoption name Use NNUE value ${config.options.useNNUE}`);
    stockfish.postMessage(`ucinewgame`);
    if (config.startPosition === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
      stockfish.postMessage(`position startpos`);
    } else {
      stockfish.postMessage(`position fen ${config.startPosition}`);
    }
  } else if ((message.type = "move")) {
    if (!message.moves) return;
    if (!message.fen) return;
    const moves = message.moves.join(" ");
    const activeColor = message.fen.split(" ")[1] as Chess.Color;
    if (activeColor === config.playerColor) return;
    stockfish.postMessage(`position startpos moves ${moves}`);
    if (config.depth === "auto") {
      if (message.timeRemaining) {
        const wtime = message.timeRemaining.w;
        const btime = message.timeRemaining.b;
        const winc = (config.timeControl?.incrementSeconds || 0) * 1000;
        const binc = (config.timeControl?.incrementSeconds || 0) * 1000;
        stockfish.postMessage(`go wtime ${wtime} btime ${btime} winc ${winc} binc ${binc}`);
      } else {
        stockfish.postMessage(`go depth 18`);
      }
    } else {
      stockfish.postMessage(`go depth ${config.depth}`);
    }
  } else if (message.type === "abort") {
    stockfish.postMessage(`stop`);
  }
};

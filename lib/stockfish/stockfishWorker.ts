import * as Chess from "../chess";

export interface StockfishOptions {
  useNNUE: boolean;
  uciLimitStrength: boolean;
  uciElo: number;
  threads: number;
  hash: number;
  skillLevel: number;
}

export interface EngineGameConfig extends Chess.GameConfig {
  playerColor: "w" | "b";
  stockfishOptions: StockfishOptions;
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

let ready = false;
let config: EngineGameConfig = {
  startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  timeControl: null,
  playerColor: "w",
  stockfishOptions: defaultOptions,
  depth: "auto",
};

export interface Message {
  type: "move" | "newGame" | "abort" | "isReady";
  moves?: string[];
  fen?: string;
  config?: EngineGameConfig;
  timeRemaining?: Record<Chess.Color, number>;
}

export interface Response {
  type: "move" | "ready";
  move?: string;
}
const wasmSupported =
  typeof WebAssembly === "object" && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
const stockfish = new Worker(wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js");

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
  console.log(message);
  if (message.type === "newGame") {
    if (!message.config) return;
    config = message.config;
    console.log(config);
    stockfish.postMessage(`setoption name Skill Level value ${config.stockfishOptions.skillLevel}`);
    stockfish.postMessage(`setoption name Threads value ${config.stockfishOptions.threads}`);
    stockfish.postMessage(`setoption name Hash value ${config.stockfishOptions.hash}`);
    stockfish.postMessage(`setoption name UCI_Elo value ${config.stockfishOptions.uciElo}`);
    stockfish.postMessage(`setoption name UCI_LimitStrength value ${config.stockfishOptions.uciLimitStrength}`);
    stockfish.postMessage(`setoption name Use NNUE value ${config.stockfishOptions.useNNUE}`);
    stockfish.postMessage(`ucinewgame`);
    if (config.startPosition === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
      stockfish.postMessage(`position startpos`);
    } else {
      stockfish.postMessage(`position fen ${config.startPosition}`);
    }
    const activeColor = config.startPosition.split(" ")[1] as Chess.Color;
    if (activeColor === config.playerColor) {
      return;
    } else [stockfish.postMessage(`go depth ${config.depth}}`)];
  } else if ((message.type = "move")) {
    if (!message.fen) return;
    const moves = message.moves?.join(" ");
    const activeColor = message.fen.split(" ")[1] as Chess.Color;
    stockfish.postMessage(`position fen ${message.fen}`);
    if (activeColor === config.playerColor) {
      //stockfish.postMessage(`go ponder`);
      return;
    }

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
  } else if (message.type === "isReady") {
    self.postMessage({ type: "ready" });
  }
};

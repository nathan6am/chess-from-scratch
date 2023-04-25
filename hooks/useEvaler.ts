import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import * as commands from "@/lib/chess/UciCmds";
//import { UCIMove } from "@/lib/chess/UciCmds";
import * as Chess from "@/lib/chess";
import _ from "lodash";
import {
  EvalOptions,
  EvalScore,
  UCIMove,
  parseInfoMessage,
  parseUciMove,
} from "@/lib/chess/stockfishUtils";
import axios from "axios";

interface Evaluation {
  fen: string;
  depth: number;
  score: EvalScore;
  move: UCIMove;
  lines: Line[];
  isCloudEval?: boolean;
}

interface Line {
  score: EvalScore;
  moves: UCIMove[];
}
interface CloudEval {
  depth: number;
  fen: string;
  knodes: number;
  pvs: Array<{ cp?: number; mate?: number; moves: string }>;
}

//Converts a variation to a line object with score
function pvToLine(pv: { cp?: number; mate?: number; moves: string }): Line {
  if (pv.cp === undefined && pv.mate === undefined) throw new Error("Invalid pv object");
  if (!(pv.cp || pv.cp === 0) && !(pv.mate || pv.mate === 0)) throw new Error("Invalid pv object");
  const score: commands.EvalScore =
    pv.cp || pv.cp === 0 ? { type: "cp", value: pv.cp } : { type: "mate", value: pv.mate || 0 };
  const moves = pv.moves.split(" ").map((move) => commands.parseUciMove(move));
  return {
    score,
    moves,
  };
}

function normalizeFen(fen: string): string {
  //remove fullMoveNumber and halfMoveClock
  const fenParts = fen.split(" ");
  return fenParts.slice(0, 4).join(" ");
}

//Converts a cloud eval to a local eval
function convertCloudEval(cloudEval: CloudEval, activeColor: Chess.Color, fen: string): Evaluation {
  if (!cloudEval.pvs.length) throw new Error("No lines");

  const lines = cloudEval.pvs.map((pv) => pvToLine(pv));
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

  const move = commands.parseUciMove(cloudEval.pvs[0].moves[0]);
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

export interface Evaler {
  evaluation: Evaluation | null;
  isReady: boolean;
  isEvaluating: boolean;
  currentDepth: number;
  currentScore: EvalScore;
  currentMove: UCIMove | null;
  currentLines: Line[];
  options: EvalOptions;
  updateOptions: (newOptions: Partial<EvalOptions>) => void;
  fenEvaluating: string | null;
}
function useEvaler(fen: string, disabled: boolean): Evaler {
  const wasmSupported =
    typeof WebAssembly === "object" &&
    WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
  const stockfishRef = React.useRef<Worker>();
  const [isReady, setIsReady] = useState(false);
  const cancelled = useRef<boolean>(false);
  const abortedRef = useRef<boolean>(false);
  const [options, setOptions] = useState<EvalOptions>({
    useCloudEval: true,
    depth: 18,
    useNNUE: true,
    multiPV: 3,
    showLinesAfterDepth: 10,
    showEvalBar: true,
  });
  const updateOptions = (newOptions: Partial<EvalOptions>) => {
    setOptions((prevOptions) => ({ ...prevOptions, ...newOptions }));
  };
  const [error, setError] = useState<Error | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [currentScore, setCurrentScore] = useState<EvalScore>({ type: "cp", value: 0 });
  const [currentMove, setCurrentMove] = useState<UCIMove | null>(null);
  const [currentLines, setCurrentLines] = useState<Line[]>([]);
  const [isCloudEval, setIsCloudEval] = useState(false);
  const evalCache = useMemo<Map<string, Evaluation>>(() => new Map(), []);
  const evalComplete = useRef<boolean>(false);
  const fenEvaluating = useRef<string | null>(null);
  const evaluation = useMemo<Evaluation | null>(() => {
    if (evalComplete.current && fen === fenEvaluating.current && currentMove) {
      return {
        fen,
        depth: currentDepth,
        score: currentScore,
        move: currentMove,
        lines: currentLines,
        isCloudEval,
      };
    } else return null;
  }, [
    currentDepth,
    currentLines,
    currentMove,
    currentScore,
    evalComplete,
    fen,
    fenEvaluating,
    isCloudEval,
  ]);
  //cache evals
  useEffect(() => {
    if (evaluation) {
      evalCache.set(normalizeFen(evaluation.fen), evaluation);
    }
  }, [evaluation, evalCache]);

  //intialize stockfish
  useEffect(() => {
    stockfishRef.current = new Worker(
      wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js"
    );
    // return () => {
    //   stockfishRef.current?.terminate();
    // };
  }, []);
  //Verify engine is ready
  useEffect(() => {
    if (cancelled.current === true) return;
    if (isReady) return;
    if (!window.Worker || !stockfishRef.current) return;
    const stockfish = stockfishRef.current;
    const initalize = async () => {
      const status = await commands.ready(stockfish);
      return status;
    };
    initalize().then((ready) => {
      if (ready) {
        setIsReady(true);
      } else {
        setIsReady(false);
      }
    });
    return () => {
      cancelled.current = true;
    };
  }, []);

  //Handle messages from stockfish
  const onMessage = useCallback(
    (e: MessageEvent) => {
      const data = e.data;
      //console.log(e.data);
      const args = data.split(" ");
      //Return if the current fen is not the same as the one being evaluated
      if (fenEvaluating.current !== fen) return;
      const currentFen = fenEvaluating.current;
      if (args[0] === "info" && !(args.includes("string") || args.includes("currmove"))) {
        abortedRef.current = false;
        const multiplier = currentFen.split(" ")[1] === "w" ? 1 : -1;

        const info = parseInfoMessage(data);
        info.score.value = info.score.value * multiplier;
        if (info.score.type !== "cp" && info.score.type !== "mate") return;

        if (info.multiPV === 1) {
          setCurrentMove(info.pv[0]);
          setCurrentDepth(info.depth);
          setCurrentScore(info.score as EvalScore);
        }
        if (info.depth >= 10) {
          const line = {
            score: info.score as EvalScore,
            moves: info.pv,
          };
          setCurrentLines((lines) => {
            const newLines = [...lines];
            newLines[info.multiPV - 1] = line;
            return newLines;
          });
        }
      }
      if (data.startsWith("bestmove")) {
        if (abortedRef.current) {
          abortedRef.current = false;
          return;
        }
        if (fenEvaluating.current !== fen) return;
        setIsEvaluating(false);
        evalComplete.current = true;
        setCurrentMove(parseUciMove(data.split(" ")[1]));
      }
    },
    [abortedRef, isReady, isEvaluating, fen, fenEvaluating]
  );

  const abort = useCallback(() => {
    evalComplete.current = false;
    abortedRef.current = true;
    setIsEvaluating(false);
    const stockfish = stockfishRef.current;
    if (stockfish) {
      stockfish.postMessage("stop");
    }
  }, [abortedRef, stockfishRef, evalComplete]);

  const startEval = useCallback(
    (fen: string) => {
      const stockfish = stockfishRef.current;
      if (!stockfish) return;
      stockfish.postMessage("setoption name MultiPV value " + options.multiPV);
      stockfish.postMessage("setoption name UCI_AnalyseMode value true");
      stockfish.postMessage("setoption name Use NNUE value " + options.useNNUE);
      stockfish.postMessage("position fen " + fen);
      stockfish.postMessage("go depth " + options.depth);
    },
    [stockfishRef, isReady, options]
  );

  useEffect(() => {
    if (disabled && isEvaluating) {
      abort();
    }
  }, [disabled, isEvaluating]);
  const evaluate = useCallback(
    async (fen: string) => {
      //Stop any current active evaluations
      abort();
      setCurrentLines([]);
      fenEvaluating.current = fen;
      const fetchCloudEval = async (fen: string, multiPv: number): Promise<Evaluation | null> => {
        try {
          const res = await axios.get("https://lichess.org/api/cloud-eval", {
            params: {
              fen,
              multiPv: multiPv,
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
      };
      const normalizedFen = normalizeFen(fen);
      const cachedEval = evalCache.get(normalizedFen);
      if (!isReady) return;

      if (cachedEval) {
        if (
          cachedEval.depth >= options.depth &&
          cachedEval.lines.length >= options.multiPV &&
          !(options.useCloudEval === false && cachedEval.isCloudEval)
        ) {
          setCurrentDepth(cachedEval.depth);
          setCurrentLines(cachedEval.lines);
          setCurrentMove(cachedEval.move);
          setCurrentScore(cachedEval.score);
          evalComplete.current = true;
          return;
        }
      }
      if (options.useCloudEval) {
        const cloudEval = await fetchCloudEval(fen, options.multiPV);
        if (cloudEval) {
          evalCache.set(normalizedFen, cloudEval);
          setCurrentDepth(cloudEval.depth);
          setCurrentLines(cloudEval.lines);
          setCurrentMove(cloudEval.move);
          setCurrentScore(cloudEval.score);
          setIsCloudEval(true);
          evalComplete.current = true;
          return;
        }
      }
      setCurrentDepth(0);

      setCurrentMove(null);
      setIsCloudEval(false);
      startEval(fen);
    },
    [abort, isReady, options, startEval, evalCache]
  );

  //Register message handler
  useEffect(() => {
    if (!stockfishRef.current) return;
    const stockfish = stockfishRef.current;
    stockfish.addEventListener("message", onMessage);
    return () => {
      stockfish.removeEventListener("message", onMessage);
    };
  }, [onMessage]);

  const lastOptions = useRef<EvalOptions>(options);
  const lastFen = useRef<string>();
  //evaluate on fen or options change
  useEffect(() => {
    console.log(isReady);
    if (!isReady) return;
    if (disabled) return;
    if (lastFen.current === fen) {
      lastOptions.current = options;
      if (_.isEqual(lastOptions.current, options)) return;
      if (lastOptions.current.depth > options.depth) return;
      if (lastOptions.current.multiPV > options.multiPV) return;
      evaluate(fen);
    } else {
      console.log("here2");
      lastFen.current = fen;
      evaluate(fen);
    }
  }, [isReady, fen, options, evaluate, disabled]);

  return {
    isReady,
    isEvaluating,
    currentDepth,
    currentMove,
    currentLines,
    currentScore,
    evaluation,
    options,
    updateOptions,
    fenEvaluating: fenEvaluating.current || null,
  };
}

export default useEvaler;

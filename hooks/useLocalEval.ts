import React, { useReducer, useRef, useMemo, useState, useEffect, useCallback } from "react";
import * as commands from "@/lib/chess/UciCmds";
import { NodeData, Color } from "@/lib/chess";
import type { FinalEvaluation, PartialEval, EvalScore } from "@/lib/chess/UciCmds";
import axios from "axios";
interface Options {
  multiPV: number;
  useNNUE: boolean;
  depth: number;
  useCloud: boolean;
  showEvalBar: boolean;
}
const defaultOptions = {
  useCloud: true,
  multiPV: 3,
  useNNUE: true,
  depth: 18,
  showEvalBar: true,
};
interface CloudEval {
  depth: number;
  fen: string;
  knodes: number;
  pvs: Array<{ cp?: number; mate?: number; moves: string }>;
}

function pvToLine(pv: { cp?: number; mate?: number; moves: string }): commands.Line {
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
function convertCloudEval(cloudEval: CloudEval, activeColor: Color): FinalEvaluation {
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

  const bestMove = commands.parseUciMove(cloudEval.pvs[0].moves[0]);
  const score = lines[0].score;
  return {
    bestMove,
    lines,
    depth: cloudEval.depth,
    isCloud: true,
    time: 0,
    score,
  };
}
export interface Evaler {
  currentOptions: Options;
  isReady: boolean;
  evaluation: FinalEvaluation | null;
  getEvaluation: (fen: string, cachedEval?: FinalEvaluation | undefined) => Promise<FinalEvaluation | undefined>;
  currentDepth: number;
  currentScore: EvalScore | null;
  error: Error | null;
  inProgress: boolean;
  finished: boolean;
  bestMove: commands.UCIMove | null;
  wasmSupported: boolean;
  updateOptions: (updates: Partial<Options>) => void;
  stop: () => Promise<void>;
}

export default function useLocalEval(initialOptions?: Partial<Options>): Evaler {
  const [options, setOptions] = useState<Options>({
    ...initialOptions,
    ...defaultOptions,
  });
  const [error, setError] = useState<Error | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [currentScore, setCurrentScore] = useState<EvalScore | null>(null);
  const [currentDepth, setCurrentDepth] = useState<number>(0);
  const [bestMove, setBestMove] = useState<commands.UCIMove | null>(null);
  const [evaluation, setEvaluation] = useState<FinalEvaluation | null>(null);
  const [finished, setFinished] = useState<boolean>(false);
  const lastFen = useRef<string>();
  const wasmSupported =
    typeof WebAssembly === "object" &&
    WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

  //Intialize worker
  const updateOptions = (updates: Partial<Options>) => {
    setOptions((current) => ({ ...current, ...updates }));
  };
  const stockfishRef = useRef<Worker>();
  const [isReady, setIsReady] = useState(false);
  const cancelled = useRef<boolean>(false);
  useEffect(() => {
    stockfishRef.current = new Worker(wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js");
  }, []);

  //Verify engine is ready
  useEffect(() => {
    if (cancelled.current === true) return;
    if (isReady) return;
    if (!window.Worker || !stockfishRef.current) return;
    const stockfish = stockfishRef.current;
    const initalize = async () => {
      const status = await commands.startup(stockfish);
      return status;
    };
    initalize().then((status) => {
      if (status.ready === true) {
        setIsReady(true);
        //console.log(status.options);
      } else {
        console.error("engine timeout error");
        setError(new Error("Stockfish timeout error: no response"));
      }
    });
    return () => {
      cancelled.current = true;
    };
  }, []);

  useEffect(() => {
    if (lastFen.current) getEvaluation(lastFen.current);
  }, [options]);

  const getEvaluation = async (
    fen: string,
    cachedEval?: FinalEvaluation | undefined
  ): Promise<FinalEvaluation | undefined> => {
    if (!isReady || !stockfishRef.current) {
      setError(new Error("Eval engine not yet initialized"));
      return;
    } else {
      lastFen.current = fen;
      const evaler = stockfishRef.current;
      if (inProgress) await commands.stop(evaler);

      if (cachedEval && cachedEval.depth >= options.depth && cachedEval.lines.length >= options.multiPV) {
        setEvaluation(cachedEval);
        setCurrentDepth(cachedEval.depth);
        setCurrentScore(cachedEval.score);

        return;
      } else if (options.useCloud) {
        try {
          const res = await axios.get("https://lichess.org/api/cloud-eval", {
            params: {
              fen,
              multiPv: options.multiPV,
            },
          });

          if (res.status === 200 && res.data) {
            const activeColor = fen.split(" ")[1] as Color;
            const cloudEval: CloudEval = res.data;
            const evaluation = convertCloudEval(cloudEval, activeColor);
            setEvaluation(evaluation);
            setCurrentDepth(evaluation.depth);
            setCurrentScore(evaluation.score);
            setBestMove(evaluation.bestMove);
            return;
          }
        } catch (e) {}
      }
      setCurrentDepth(0);
      //Callback runs with every depth, with the partial evalutaion for that depth passed as an argument
      //before promise resolves with final evalutaion
      const cb = (partialEval: PartialEval) => {
        setCurrentDepth(partialEval.depth);
        setCurrentScore(partialEval.score);
        if (partialEval.bestMove) {
          setBestMove(partialEval.bestMove);
        }
      };
      setInProgress(true);
      setFinished(false);
      try {
        const result = await commands.getEvaluation(evaler, { fen: fen, ...options }, cb);
        setEvaluation(result);
        setCurrentDepth(result.depth);
        setBestMove(result.bestMove);
        setInProgress(false);
        setFinished(true);
        return result;
      } catch (e) {
        if (e instanceof Error) {
          setError(e);
        }
        setInProgress(false);
      }
    }
  };

  const stop = async () => {
    const evaler = stockfishRef.current;
    if (!evaler) return;
    if (inProgress) {
      await commands.stop(evaler);
      setInProgress(false);
    }
  };

  return {
    currentOptions: options,
    updateOptions,
    isReady,
    evaluation,
    getEvaluation,
    currentDepth,
    currentScore,
    error,
    inProgress,
    finished,
    bestMove,
    wasmSupported,
    stop,
  };
}

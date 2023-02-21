import React, { useReducer, useRef, useMemo, useState, useEffect, useCallback } from "react";
import * as commands from "@/lib/chess/UciCmds";
import { NodeData } from "@/lib/chess";
import type { FinalEvaluation, PartialEval, EvalScore } from "@/lib/chess/UciCmds";

interface Options {
  multiPV: number;
  useNNUE: boolean;
  depth: number;
  useCloud?: boolean;
}
const defaultOptions = {
  multiPV: 3,
  useNNUE: true,
  depth: 18,
};

export interface Evaler {
  currentOptions: Options;
  isReady: boolean;
  evaluation: FinalEvaluation | null;
  getEvaluation: (
    fen: string,
    cachedEval?: FinalEvaluation | undefined
  ) => Promise<FinalEvaluation | undefined>;
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
    stockfishRef.current = new Worker(
      wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js"
    );
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

      if (
        cachedEval &&
        cachedEval.depth >= options.depth &&
        cachedEval.lines.length >= options.multiPV
      ) {
        setEvaluation(cachedEval);
        setCurrentDepth(cachedEval.depth);
        setCurrentScore(cachedEval.score);

        return;
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

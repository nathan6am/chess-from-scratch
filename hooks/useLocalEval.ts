import React, { useReducer, useRef, useMemo, useState, useEffect, useCallback } from "react";
import useChessLocal from "./useChessLocal";
import * as commands from "@/util/chess/UciCmds";

interface Options {
  multiPV: number;
  useNNUE: boolean;
  depth: number;
}
const defaultOptions = {
  multiPV: 3,
  useNNUE: true,
  depth: 18,
};

export default function useLocalEval(initialOptions?: Partial<Options>) {
  const [options, setOptions] = useState<Options>({
    ...initialOptions,
    ...defaultOptions,
  });
  const [error, setError] = useState<Error | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [finished, setFinished] = useState<boolean>(false);
  const wasmSupported =
    typeof WebAssembly === "object" &&
    WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

  //Intialize worker
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

  const getEvaluation = async (fen: string) => {
    //Callback runs with every depth, with the partial evalutaion for that depth passed as an argument
    //before promise resolves with final evalutaion
    const cb = (evaluation: any) => {
      setEvaluation(evaluation);
    };

    if (!isReady || !stockfishRef.current) {
      setError(new Error("Eval engine not yet initialized"));
    } else {
      const evaler = stockfishRef.current;
      if (inProgress) {
        const stopped = await commands.stop(evaler);
        //console.log(stopped);
      }
      setInProgress(true);
      setFinished(false);
      commands
        .getEvaluation(evaler, { fen, ...options }, cb)
        .then((result) => {
          setEvaluation(result);
          setInProgress(false);
          setFinished(true);
        })
        .catch((e) => setError(e));
    }
  };

  return {
    isReady,
    evaluation,
    getEvaluation,
    error,
    inProgress,
    finished,
    wasmSupported,
  };
}

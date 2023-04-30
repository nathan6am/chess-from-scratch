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
} from "@/lib/stockfish/utils";
import axios from "axios";
import useDebounce from "./useDebounce";
import { MessageResponse } from "@/lib/stockfish/evalWorker";
export interface Evaler {
  currentScore: EvalScore;
  currentDepth: number;
  lines: string[][];
  isEvaluating: boolean;
  options: EvalOptions;
  updateOptions: (options: Partial<EvalOptions>) => void;
}
function useEvaler(fen: string): Evaler {
  const debouncedFen = useDebounce(fen, 500);
  const [evalScore, setEvalScore] = useState<EvalScore>({ value: 0, type: "cp" });
  const [currentDepth, setCurrentDepth] = useState<number>(0);
  const [lines, setLines] = useState<string[][]>([]);
  const [options, setOptions] = useState<EvalOptions>({
    useCloudEval: false,
    depth: 20,
    useNNUE: false,
    multiPV: 1,
    showLinesAfterDepth: 0,
  });
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    workerRef.current = new Worker(new URL("../lib/stockfish/evalWorker.ts", import.meta.url));
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const message = e.data as MessageResponse;
      if (message.type === "updateScore") {
        if (!message.score || !message.depth) return;
        setEvalScore(message.score);
        setCurrentDepth(message.depth);
      }
      if (message.type === "updateLine") {
        if (!message.line || message.index === undefined) return;
        setLines((prev) => {
          const newLines = [...prev];
          newLines[message.index || 0] = message.line?.moves || [];
          return newLines;
        });
      }
    };
    workerRef.current?.addEventListener("message", handler);
    return () => {
      workerRef.current?.removeEventListener("message", handler);
    };
  }, [workerRef]);
  useEffect(() => {
    workerRef.current?.postMessage({ type: "evaluateFen", fen: debouncedFen });
  }, [debouncedFen]);
  return {
    currentScore: evalScore,
    currentDepth,
    lines,
    isEvaluating: false,
    options,
    updateOptions: (options: Partial<EvalOptions>) => {
      setOptions((prev) => ({ ...prev, ...options }));
    },
  };
}
export default useEvaler;

import React, { useState, useEffect, useRef, useMemo } from "react";
import _ from "lodash";
import { EvalOptions, EvalScore } from "@/lib/stockfish/utils";
import useDebounce from "../utils/useDebounce";

import { MessageResponse, Variation } from "@/lib/stockfish/evalWorker";
import useThrottle from "../utils/useThrottle";
import { notEmpty } from "@/util/misc";
export interface Evaler {
  currentScore: EvalScore;
  currentDepth: number;
  lines: Array<{ score: EvalScore; moves: string[] }>;
  isEvaluating: boolean;
  options: EvalOptions;
  updateOptions: (options: Partial<EvalOptions>) => void;
  isCloud: boolean;
  fenEvaluating: string;
}
function useEvaler(fen: string, disabled?: boolean): Evaler {
  const debouncedFen = useDebounce(fen, 1000);
  const [evalScore, setEvalScore] = useState<EvalScore>(() => ({ value: 0, type: "cp" }));
  const currentScore = useThrottle(evalScore, 400);
  const [currentDepth, setCurrentDepth] = useState<number>(0);
  const [isCloud, setIsCloud] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentLines, setCurrentLines] = useState<Variation[]>([]);
  const [fenEvaluating, setFenEvaluating] = useState<string>("");
  const lines = useMemo(() => {
    return currentLines.filter(notEmpty);
  }, [currentLines]);

  const bestMove = useMemo(() => {
    return lines[0]?.moves[0];
  }, [lines]);
  const [options, setOptions] = useState<EvalOptions>({
    useCloudEval: true,
    depth: 18,
    useNNUE: true,
    multiPV: 3,
    showLinesAfterDepth: 10,
  });
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    workerRef.current = new Worker(new URL("../../lib/stockfish/evalWorker.ts", import.meta.url));
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const message = e.data as MessageResponse;
      //if (message.fen !== fen) return;
      if (message.type === "updateScore") {
        if (!message.score || !message.depth) return;
        if (message.depth < 6) return;
        setEvalScore(message.score);
        setCurrentDepth(message.depth);
      }
      if (message.type === "updateLine") {
        if (!message.line || message.index === undefined) return;
        const index = message.index || 0;
        setCurrentLines((prev) => {
          const newLines = [...prev];
          if (message.line) {
            newLines[index] = message.line;
          }
          return newLines;
        });
      }
      if (message.type === "finalEval") {
        if (!message.eval) return;
        setIsEvaluating(false);
        setEvalScore(message.eval.score);
        setCurrentDepth(message.eval.depth);
        setIsCloud(message.eval.isCloudEval || false);
        setCurrentLines(message.eval.lines || []);
      }
    };
    workerRef.current?.addEventListener("message", handler);
    return () => {
      workerRef.current?.removeEventListener("message", handler);
    };
  }, [workerRef]);

  useEffect(() => {
    if (disabled) {
      //console.log("disabling");
      workerRef.current?.postMessage({ type: "disable" });
    } else {
      workerRef.current?.postMessage({ type: "enable" });
    }
  }, [disabled, workerRef]);

  useEffect(() => {
    if (disabled) return;
    if (debouncedFen === fenEvaluating) return;
    setIsEvaluating(true);
    setCurrentDepth(0);
    setCurrentLines([]);
    setIsCloud(false);
    setFenEvaluating(debouncedFen);
    workerRef.current?.postMessage({ type: "evaluateFen", fen: debouncedFen });
  }, [debouncedFen, disabled, workerRef, fenEvaluating]);

  const prevOptions = useRef<EvalOptions>(options);
  useEffect(() => {
    if (disabled) return;
    if (_.isEqual(prevOptions.current, options)) return;
    prevOptions.current = options;
    workerRef.current?.postMessage({ type: "setOptions", options });
  }, [options, disabled, workerRef, prevOptions]);
  return {
    currentScore,
    currentDepth,
    lines: lines.slice(0, options.multiPV),
    isEvaluating,
    fenEvaluating,
    isCloud,
    options,
    updateOptions: (options: Partial<EvalOptions>) => {
      setOptions((prev) => ({ ...prev, ...options }));
    },
  };
}
export default useEvaler;

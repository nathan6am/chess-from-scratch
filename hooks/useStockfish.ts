import React, { useReducer, useRef, useMemo, useState, useEffect, useCallback } from "react";
import useChessLocal from "./useChessLocal";
import * as commands from "@/util/chess/UciCmds";

export default function useStockfish() {
  const [error, setError] = useState<Error | null>(null);
  var wasmSupported =
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
        console.log(status.options);
      } else {
        console.error("engine timeout error");
        setError(new Error("Stockfish timeout error: no response"));
      }
    });
    return () => {
      cancelled.current = true;
    };
  }, []);

  const onMessage = (e: MessageEvent) => {
    console.log(e.data);
  };

  // //Initialize and ready
  useEffect(() => {
    if (!window.Worker || !stockfishRef.current) return;
    if (!isReady) return;
    const stockfish = stockfishRef.current;

    stockfish.addEventListener("message", onMessage);

    stockfish.postMessage("setoption name Use NNUE value true");
    stockfish.postMessage("setoption name UCI_AnalyseMode value true");
    //stockfish.postMessage("setoption name MultiPV value 3");
    stockfish.postMessage("ucinewgame");
    stockfish.postMessage("go depth 30");
    //stockfish.postMessage("eval");

    return () => {
      stockfish.removeEventListener("message", onMessage);
    };
  }, [isReady]);
}

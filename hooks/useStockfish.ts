import React, { useReducer, useRef, useMemo, useState, useEffect, useCallback } from "react";
import useChessLocal from "./useChessLocal";

export default function useStockfish() {
  var wasmSupported =
    typeof WebAssembly === "object" &&
    WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
  const stockfishRef = useRef<Worker>();
  useEffect(() => {
    stockfishRef.current = new Worker(wasmSupported ? "/stockfishNNUE/src/stockfish.js" : "/stockfish/stockfish.js");
  }, []);

  const { game, move } = useChessLocal();
  const onMessage = (e: MessageEvent) => {
    console.log(e.data);
  };
  useEffect(() => {
    if (!window.Worker || !stockfishRef.current) return;
    const stockfish = stockfishRef.current;
    stockfish.addEventListener("message", onMessage);
    stockfish.postMessage("uci");
    stockfish.postMessage("ucinewgame");

    stockfish.postMessage("position fen " + game.fen);
    stockfish.postMessage("go depth 10");
    return () => {
      stockfish.removeEventListener("message", onMessage);
    };
  }, []);
}

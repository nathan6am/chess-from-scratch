import * as Chess from "@/lib/chess";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";

export interface BoardEditorHook {
  board: Chess.Board;
  fen: string;
  onAddPiece: (square: Chess.Square, piece: Chess.Piece) => void;
  onRemovePiece: (square: Chess.Square) => void;
  onMovePiece: (from: Chess.Square, to: Chess.Square) => void;
  setFromFen: (fen: string) => void;
  errorMessage: string | null;
  setActiveColor: React.Dispatch<React.SetStateAction<Chess.Color>>;
  setCastleRights: React.Dispatch<React.SetStateAction<Record<Chess.Color, { kingSide: boolean; queenSide: boolean }>>>;
  setEnPassantTarget: React.Dispatch<React.SetStateAction<Chess.Square | null>>;
  activeColor: Chess.Color;
  castleRights: Record<Chess.Color, { kingSide: boolean; queenSide: boolean }>;
  enPassantTarget: Chess.Square | null;
  pieceCursor: Chess.Piece | "remove" | null;
  setPieceCursor: React.Dispatch<React.SetStateAction<Chess.Piece | "remove" | null>>;
  disabledCastling: Record<Chess.Color, { kingSide: boolean; queenSide: boolean }>;
  clearBoard: () => void;
  resetToStartPosition: () => void;
  isValid: true | string;
  setHalfMoveCount: React.Dispatch<React.SetStateAction<number>>;
  setFullMoveCount: React.Dispatch<React.SetStateAction<number>>;
  halfMoveCount: number;
  fullMoveCount: number;
}
export default function useBoardEditor(
  startPosition: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
): BoardEditorHook {
  const [pieceCursor, setPieceCursor] = useState<Chess.Piece | "remove" | null>(null);
  const [activeColor, setActiveColor] = useState<Chess.Color>("w");
  const [halfMoveCount, setHalfMoveCount] = useState(0);
  const [fullMoveCount, setFullMoveCount] = useState(1);
  const [castleRights, setCastleRights] = useState<Record<Chess.Color, { kingSide: boolean; queenSide: boolean }>>({
    w: { kingSide: true, queenSide: true },
    b: { kingSide: true, queenSide: true },
  });

  const [position, setPosition] = useState<Chess.Position>(new Map());
  const [enPassantTarget, setEnPassantTarget] = useState<Chess.Square | null>(null);
  const board = Chess.positionToBoard(position);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const disabledCastling = useMemo(() => {
    const whiteKingside = position.get("e1")?.type === "k" && position.get("h1")?.type === "r";
    const whiteQueenside = position.get("e1")?.type === "k" && position.get("a1")?.type === "r";
    const blackKingside = position.get("e8")?.type === "k" && position.get("h8")?.type === "r";
    const blackQueenside = position.get("e8")?.type === "k" && position.get("a8")?.type === "r";
    return {
      w: {
        kingSide: !whiteKingside,
        queenSide: !whiteQueenside,
      },
      b: {
        kingSide: !blackKingside,
        queenSide: !blackQueenside,
      },
    };
  }, [position]);
  const gameState: Chess.GameState = useMemo(() => {
    return {
      position,
      activeColor,
      enPassantTarget,
      castleRights: {
        w: {
          kingSide: disabledCastling.w.kingSide ? false : castleRights.w.kingSide,
          queenSide: disabledCastling.w.queenSide ? false : castleRights.w.queenSide,
        },
        b: {
          kingSide: disabledCastling.b.kingSide ? false : castleRights.b.kingSide,
          queenSide: disabledCastling.b.queenSide ? false : castleRights.b.queenSide,
        },
      },
      fullMoveCount,
      halfMoveCount,
    };
  }, [position, activeColor, enPassantTarget, castleRights]);
  const clearBoard = useCallback(() => {
    setPosition(new Map());
  }, []);

  const fen = useMemo(() => {
    return Chess.gameStateToFen(gameState);
  }, [gameState]);
  const onAddPiece = (square: Chess.Square, piece: Chess.Piece) => {
    setPosition((prev) => new Map(prev).set(square, { ...piece, key: square }));
    setEnPassantTarget(null);
  };

  const onRemovePiece = (square: Chess.Square) => {
    setPosition((prev) => {
      const map = new Map(prev);
      map.delete(square);
      return map;
    });
  };

  const setFromFen = (fen: string) => {
    const gameState = Chess.fenToGameState(fen);
    if (gameState) {
      setPosition(gameState.position);
      setActiveColor(gameState.activeColor);
      setEnPassantTarget(gameState.enPassantTarget);
      setCastleRights(gameState.castleRights);
    } else {
      setErrorMessage("Invalid FEN");
    }
  };
  useEffect(() => {
    setFromFen(startPosition);
  }, [startPosition]);

  const resetToStartPosition = useCallback(() => {
    setFromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  }, []);

  const isValid = useMemo(() => {
    return Chess.validateFen(fen);
  }, [fen]);

  const isDoublePush = (start: Chess.Square, end: Chess.Square, piece: Chess.Piece): false | Chess.Square => {
    if (piece.type !== "p") return false;
    const [startX, startY] = Chess.squareToCoordinates(start);
    const [endX, endY] = Chess.squareToCoordinates(end);
    if (startX !== endX) return false;
    if (Math.abs(endY - startY) !== 2) return false;
    if (piece.color === "w" && startY !== 1) return false;
    if (piece.color === "b" && startY !== 6) return false;
    return Chess.toSquare([endX, (endY + startY) / 2]);
  };

  const onMovePiece = (start: Chess.Square, end: Chess.Square) => {
    const piece = position.get(start);
    if (!piece) return;
    const doublePush = isDoublePush(start, end, piece);
    if (doublePush) {
      setEnPassantTarget(doublePush);
    } else {
      setEnPassantTarget(null);
    }
    setPosition((prev) => {
      const map = new Map(prev);
      const piece = map.get(start);
      if (!piece) return prev;
      map.delete(start);
      map.set(end, { ...piece, key: end });
      return map;
    });
  };

  return {
    isValid,
    board,
    fen,
    setFromFen,
    onAddPiece,
    onRemovePiece,
    errorMessage,
    setActiveColor,
    setCastleRights,
    setEnPassantTarget,
    enPassantTarget,
    activeColor,
    castleRights,
    onMovePiece,
    pieceCursor,
    setPieceCursor,
    disabledCastling,
    clearBoard,
    resetToStartPosition,
    halfMoveCount,
    setHalfMoveCount,
    fullMoveCount,
    setFullMoveCount,
  };
}

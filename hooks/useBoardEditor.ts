import * as Chess from "@/lib/chess";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";

export default function useBoardEditor(
  startPosition: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
) {
  const [activeColor, setActiveColor] = useState<Chess.Color>("w");
  const [castleRights, setCastleRights] = useState<Record<Chess.Color, { kingSide: boolean; queenSide: boolean }>>({
    w: { kingSide: true, queenSide: true },
    b: { kingSide: true, queenSide: true },
  });

  const [position, setPosition] = useState<Chess.Position>(new Map());
  const [enPassantTarget, setEnPassantTarget] = useState<Chess.Square | null>(null);
  const board = useMemo(() => {
    return Chess.positionToBoard(position);
  }, [position]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const gameState: Chess.GameState = useMemo(() => {
    return {
      position,
      activeColor,
      enPassantTarget,
      castleRights,
      fullMoveCount: 0,
      halfMoveCount: 0,
    };
  }, [position, activeColor, enPassantTarget, castleRights]);

  const fen = useMemo(() => {
    return Chess.gameStateToFen(gameState);
  }, [gameState]);
  const onAddPiece = (square: Chess.Square, piece: Chess.Piece) => {
    setPosition((prev) => new Map(prev).set(square, piece));
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

  const onMovePiece = (start: Chess.Square, end: Chess.Square) => {
    const piece = position.get(start);
    if (!piece) return;
    position.delete(start);
    position.set(end, piece);
  };

  return {
    board,
    fen,
    setFromFen,
    onAddPiece,
    onRemovePiece,
    errorMessage,
    setActiveColor,
    setCastleRights,
    activeColor,
    castleRights,
    onMovePiece,
  };
}

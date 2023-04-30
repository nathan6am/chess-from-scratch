import { useState, useMemo, useCallback, useEffect, MouseEventHandler } from "react";
import { ArrowColor, MarkedSquare, Arrow } from "@/lib/types";
import * as Chess from "@/lib/chess";

interface Args {
  currentSquare: Chess.Square | null;
  lockArrows?: boolean;
  color: ArrowColor;
  onArrow: (arrow: Arrow) => void;
  onMarkSquare: (square: MarkedSquare) => void;
  disabled?: boolean;
}

export default function useBoardMarkup({
  currentSquare,
  lockArrows,
  color,
  disabled,
  onArrow,
  onMarkSquare,
}: Args) {
  const [currentArrowStart, setCurrentArrowStart] = useState<Chess.Square | null>(null);
  const start = (square: Chess.Square | null) => {
    setCurrentArrowStart(square);
  };

  const currentArrow = useMemo<Arrow | null>(() => {
    if (!currentSquare || !currentArrowStart || currentArrowStart === currentSquare) return null;
    return {
      start: currentArrowStart,
      end: currentSquare,
      color: color,
    };
  }, [currentArrowStart, currentSquare, color]);

  const finalize = () => {
    if (currentArrow) {
      onArrow(currentArrow);
      setCurrentArrowStart(null);
    } else if (currentArrowStart && currentArrowStart === currentSquare) {
      onMarkSquare({ color, square: currentArrowStart });
      setCurrentArrowStart(null);
    } else {
      setCurrentArrowStart(null);
    }
  };

  const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
    if (currentSquare) {
      if (e.button === 2) start(currentSquare);
      //else clear();
    }
  };
  const onMouseUp: MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.button === 2) {
      finalize();
    }
  };
  const onContextMenu: MouseEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    if (disabled) return;
    const downhandler = (e: MouseEvent) => {
      if (currentSquare) {
        if (e.button === 2) start(currentSquare);
        //else clear();
      }
    };
    const uphandler = (e: MouseEvent) => {
      if (e.button === 2) {
        finalize();
      }
    };
    const contextmenuHandler = (e: MouseEvent) => {
      if (currentSquare) e.preventDefault();
    };
    //document.addEventListener("mousedown", downhandler);
    document.addEventListener("mouseup", uphandler);
    document.addEventListener("contextmenu", contextmenuHandler);

    return () => {
      document.removeEventListener("mousedown", downhandler);
      document.removeEventListener("mouseup", uphandler);
      document.removeEventListener("contextmenu", contextmenuHandler);
    };
  }, [currentSquare, start, finalize, lockArrows]);
  return { currentArrow, onMouseDown, onMouseUp, onContextMenu };
}

export function useArrowState() {
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [markedSquares, setMarkedSquares] = useState<MarkedSquare[]>([]);
  const onArrow = (newArrow: Arrow) => {
    setArrows((current) => {
      if (current.some((arrow) => arrow.start === newArrow.start && arrow.end === newArrow.end)) {
        return current.filter(
          (arrow) => !(arrow.start === newArrow.start && arrow.end === newArrow.end)
        );
      } else {
        return [...current, newArrow];
      }
    });
  };
  const onMarkSquare = (markedSquare: MarkedSquare) => {
    setMarkedSquares((current) => {
      if (current.some((square) => square.square === markedSquare.square)) {
        return current.filter((square) => square.square !== markedSquare.square);
      } else {
        return [...current, markedSquare];
      }
    });
  };
  const clear = () => {
    setArrows([]);
    setMarkedSquares([]);
  };
  return {
    arrows,
    markedSquares,
    onArrow,
    onMarkSquare,
    clear,
  };
}

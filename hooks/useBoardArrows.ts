import { Arrow } from "@/components/analysis/BoardArrows";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Square } from "@/lib/chess";

export interface MarkedSquare {
  square: Square;
  color: ArrowColor;
}

interface Args {
  currentSquare: Square | null;
  lockArrows?: boolean;
  color?: ArrowColor;
  disabled?: boolean;
}
export type ArrowColor = "R" | "G" | "O" | "B";

export default function useBoardArrows({
  currentSquare,
  lockArrows,
  color: colorOverride,
  disabled,
}: Args) {
  const color = useMemo(() => {
    return colorOverride || "G";
  }, [colorOverride]);

  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [markedSquares, setMarkedSquares] = useState<MarkedSquare[]>([]);
  const [currentArrowStart, setCurrentArrowStart] = useState<Square | null>(null);
  const start = (Square: Square | null) => {
    setCurrentArrowStart(currentSquare);
  };

  const currentArrow = useMemo<Arrow | null>(() => {
    if (!currentSquare || !currentArrowStart || currentArrowStart === currentSquare) return null;
    return {
      start: currentArrowStart,
      end: currentSquare,
      color: color,
    };
  }, [currentArrowStart, currentSquare, color]);

  const toggleMarkedSquare = useCallback(
    (square: Square) => {
      setMarkedSquares((cur) => {
        if (cur.some((marked) => marked.square === square))
          return cur.filter((marked) => marked.square !== square);
        else return [...cur, { square, color }];
      });
    },
    [color]
  );
  const finalize = () => {
    if (currentArrow) {
      setArrows((cur) => {
        if (
          cur.some((arrow) => arrow.start === currentArrow.start && arrow.end === currentArrow.end)
        ) {
          return cur.filter(
            (arrow) => !(arrow.start === currentArrow.start && arrow.end === currentArrow.end)
          );
        } else {
          return [...cur, currentArrow];
        }
      });
      setCurrentArrowStart(null);
    } else if (currentArrowStart) {
      if (currentSquare === currentArrowStart) toggleMarkedSquare(currentSquare);
      setCurrentArrowStart(null);
    }
  };
  const clear = () => {
    setArrows([]);
    setMarkedSquares([]);
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
    document.addEventListener("mousedown", downhandler);
    document.addEventListener("mouseup", uphandler);
    document.addEventListener("contextmenu", contextmenuHandler);

    return () => {
      document.removeEventListener("mousedown", downhandler);
      document.removeEventListener("mouseup", uphandler);
      document.removeEventListener("contextmenu", contextmenuHandler);
    };
  }, [currentSquare, start, finalize, clear, lockArrows]);
  return {
    arrows,
    pendingArrow: currentArrow,
    start,
    finalize,
    clear,
    markedSquares,
  };
}

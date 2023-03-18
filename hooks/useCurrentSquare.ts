import { useEffect, useState } from "react";
import usePointerCoordinates from "./usePointerCoordinates";
import * as Chess from "@/lib/chess";
export default function useCurrentSquare(
  orientation: Chess.Color,
  boardRef: React.RefObject<HTMLDivElement>
): Chess.Square | null {
  const [currentSquare, setCurrentSquare] = useState<Chess.Square | null>(null);
  const { x, y } = usePointerCoordinates(8, boardRef);
  useEffect(() => {
    // Only accept coordinated within the board
    if (x <= 7 && x >= 0 && y <= 7 && y >= 0) {
      const coordinates: [number, number] = orientation === "w" ? [x, 7 - y] : [7 - x, y];
      setCurrentSquare(Chess.toSquare(coordinates));
    } else {
      //Set the current square to null if the pointer is outside the board
      setCurrentSquare(null);
    }
  }, [x, y, orientation]);

  return currentSquare;
}

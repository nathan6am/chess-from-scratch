import useOpeningExplorer from "./useOpeningExplorer";
import { useEffect, useMemo, useRef } from "react";
import type { Game } from "@/lib/chess";
import _ from "lodash";

export default function useCurrentOpening(currentGame: Game) {
  const explorer = useOpeningExplorer(currentGame);
  const { data, sourceGame } = explorer;

  const startPositionOpening = useMemo(() => {
    if (sourceGame.config.startPosition === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
      return "Start Position";
    else return "Custom Position";
  }, [sourceGame.config.startPosition]);
  const prevOpening = useRef<{ name: string; eco: string } | null>({ name: startPositionOpening, eco: "" });
  const reset = () => {
    prevOpening.current = { name: startPositionOpening, eco: "" };
  };
  useEffect(() => {
    if (!data) return;
    if (data.opening && !_.isEqual(data.opening, prevOpening)) {
      prevOpening.current = data.opening;
    }
  }, [data]);
  const opening = useMemo(() => {
    return data?.opening || prevOpening.current;
  }, [data]);
  return {
    opening,
    reset,
  };
}

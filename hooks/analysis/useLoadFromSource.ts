import React, { useEffect } from "react";
import axios from "axios";
import { AnalysisHook } from "./useAnalysisBoard";
import { parsePuzzleEntity } from "@/util/parsers/puzzleParser";
import useGameCache from "@/hooks/cache/useGameCache";
import { treeFromLine } from "@/util/parsers/pgnParser";

/**
 * Hook to fetch and load analysis from a source game or puzzle
 */

interface Params {
  /**
   * Id of the saved analysis
   */
  id?: string | null;
  /**
   * Id of the source game
   */
  sourceGameId?: string | null;
  /**
   * Type of the source game
   */
  sourceGameType?: "masters" | "lichess" | "nextchess" | "last" | "puzzle" | null;
  /**
   * Reference to the initial load state
   */
  initialLoad: React.MutableRefObject<boolean>;
  /**
   * Analysis hook
   */
  analysis: AnalysisHook;
}

export default function useLoadFromSource({ id, sourceGameId, initialLoad, sourceGameType, analysis }: Params) {
  const { cachedGame } = useGameCache();
  useEffect(() => {
    if (id) return;
    if (!sourceGameId) return;
    if (initialLoad.current) return;
    if (!sourceGameType) {
      initialLoad.current = true;
      return;
    }
    switch (sourceGameType) {
      case "last":
        if (!cachedGame) return;
        initialLoad.current = true;
        analysis.loadPgn(cachedGame.pgn);
        break;
      case "puzzle":
        axios.get(`/api/puzzles/puzzle/${sourceGameId}`).then((res) => {
          initialLoad.current = true;
          if (!res.data) return;
          try {
            const puzzle = parsePuzzleEntity(res.data.puzzle);
            if (!puzzle) throw new Error("Failed to parse puzzle");
            const puzzleTree = treeFromLine(puzzle?.solution);
            analysis.setOptions((current) => ({
              ...current,
              startPosition: puzzle?.game.fen,
            }));
            analysis.tree.loadNewTree(puzzleTree);
          } catch (e) {
            console.error(e);
          }
        });
        break;
      case "nextchess":
        axios.get(`/api/game/pgn/${sourceGameId}`).then((res) => {
          initialLoad.current = true;
          if (!res.data) return;
          analysis.loadPgn(res.data);
        });
        break;
      default:
        /**
         * Fetch game from lichess api
         */
        analysis.explorer
          .fetchGameAsync(sourceGameId, sourceGameType)
          .then((game) => {
            initialLoad.current = true;
            if (!game) return;
            analysis.loadPgn(game);
          })
          .catch((e) => {
            initialLoad.current = true;
            console.error(e);
          });
    }
  }, [sourceGameId, sourceGameType, initialLoad, analysis, id]);
}

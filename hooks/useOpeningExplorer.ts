import useSWR from "swr";

import axios from "axios";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Chess from "@/lib/chess";

import { notEmpty } from "@/util/misc";
import useDebounce from "./useDebounce";

interface Options {
  startFen: string;
  database: "lichess" | "matsers";
  moves: number;
  topGames: number;
  since?: number;
  until?: number;
}

const defaultOptions: Options = {
  startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  database: "lichess",
  moves: 10,
  topGames: 15,
};

enum Endpoints {
  "lichess" = "https://explorer.lichess.ovh/lichess",
  "masters" = "https://explorer.lichess.ovh/masters",
}

import _, { min } from "lodash";
export interface ApiResponse {
  white: number;
  black: number;
  draws: number;
  moves: MoveData[];
  topGames: DBGameData[];
  recentGames?: DBGameData[];
  opening: {
    eco: string;
    name: string;
  } | null;
}

export interface MoveData {
  uci: string;
  san: string;
  averageRating: number;
  white: number;
  black: number;
  draws: number;
  game: DBGameData | null;
}

export interface DBGameData {
  uci?: string;
  winner: "black" | "white" | null;
  white: PlayerInfo;
  black: PlayerInfo;
  id: string;
  year: number;
  month: string;
}
interface OTBGameData {
  id: string;
  pgn: string;
  type: "lichess" | "masters";
}
interface PlayerInfo {
  name: string;
  rating: number;
}

export type Speed = "ultrabullet" | "bullet" | "blitz" | "rapid" | "classical" | "correspondence";
interface LichessFilters {
  speeds: Speed[];
  ratings: [RatingGroup, RatingGroup];
  since: string;
  until: string;
  moves: number;
  topGames: number;
}
interface MastersFilters {
  since: number;
  until: number;
  moves: number;
  topGames: number;
}

type RatingGroup = 0 | 1000 | 1200 | 1400 | 1600 | 1800 | 2000 | 2200 | 2500;
const ratingsToRange = (range: [RatingGroup, RatingGroup]) => {
  const [min, max] = range;
  const ratings = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500];
  const minIndex = ratings.indexOf(min);
  const maxIndex = ratings.indexOf(max);
  return ratings.slice(minIndex, maxIndex + 1).join(",");
};

const reduceMoves = (history: Chess.MoveHistory): string =>
  history
    .flat()
    .filter(notEmpty)
    .map((halfMove) => Chess.MoveToUci(halfMove.move))
    .join(",");

const fetcher = async (_params: any, database: "lichess" | "masters") => {
  const { currentFen, ...params } = _params;
  const endpoint = Endpoints[database];
  const response = await axios.get(endpoint, {
    params,
  });
  if (!response.data) throw new Error("No response data");
  return response.data as ApiResponse;
};

export interface ExplorerHook {
  database: "lichess" | "masters";
  setDatabase: (database: "lichess" | "masters") => void;
  lichessFilters: LichessFilters;
  setLichessFilters: React.Dispatch<React.SetStateAction<LichessFilters>>;
  mastersFilters: MastersFilters;
  setMastersFilters: React.Dispatch<React.SetStateAction<MastersFilters>>;
  sourceGame: Chess.Game;
  data: ApiResponse | undefined;
  error: unknown;
  isLoading: boolean;
  fetchOTBGame: (gameid: string) => void;
  otbGame: OTBGameData | null | undefined;
  otbGameLoading: boolean;
  fetchGameAsync: (gameid: string, gameType: "lichess" | "masters") => Promise<string | undefined>;
}

export default function useOpeningExplorer(currentGame: Chess.Game): ExplorerHook {
  const [database, setDatabase] = useState<"lichess" | "masters">("masters");
  const [mastersFilters, setMastersFilters] = useState<MastersFilters>({
    since: 1952,
    until: 2023,
    moves: 12,
    topGames: 15,
  });
  const [lichessFilters, setLichessFilters] = useState<LichessFilters>({
    speeds: ["bullet", "blitz", "rapid", "classical"],
    ratings: [0, 2500],
    since: "2013-01",
    until: "2023-01",
    moves: 12,
    topGames: 4,
  });
  const [gameId, fetchOTBGame] = useState<string | null>(null);
  //Debounce game state for api calls
  const fen = useMemo(() => currentGame.config.startPosition, [currentGame.config.startPosition]);
  const play = useMemo(() => reduceMoves(currentGame.moveHistory), [currentGame.moveHistory]);
  const currentFen = useMemo(() => currentGame.fen, [currentGame.fen]);
  const filters = useMemo(() => {
    if (database === "lichess") {
      return {
        ...lichessFilters,
        speeds: lichessFilters.speeds?.join(","),
        ratings: lichessFilters.ratings ? ratingsToRange(lichessFilters.ratings) : undefined,
      };
    } else {
      return mastersFilters;
    }
  }, [database, lichessFilters, mastersFilters]);
  const queryParams = useMemo(
    () => ({ fen, play, currentFen, ...filters }),
    [fen, play, currentFen, filters]
  );
  const params = useDebounce(queryParams, 500);
  //Ref to set loading state when currentGame changes before debounced game upates
  const debounceSyncRef = useRef<boolean>(false);
  useEffect(() => {
    if (params.currentFen === currentGame.fen) debounceSyncRef.current = true;
    else {
      debounceSyncRef.current = false;
    }
  }, [currentGame, params, debounceSyncRef]);
  const { data, error, isLoading } = useQuery({
    queryKey: ["explorer", params, database],
    queryFn: () => fetcher(params, database),
    keepPreviousData: false,
  });

  const {
    data: otbGame,
    error: otbGameError,
    isLoading: otbGameLoading,
  } = useQuery({
    queryKey: ["otbgame", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      if (database === "lichess") {
        const response = await axios.get(
          `https://lichess.org/game/export/${gameId}?pgnInJson=true`,
          {}
        );
        console.log(response);
        if (response && response.data?.pgn) {
          const pgn = response.data?.pgn as string;
          return {
            pgn,
            id: gameId,
            type: "lichess",
          } as OTBGameData;
        }
      } else if (database === "masters") {
        const response = await axios.get(`https://explorer.lichess.ovh/masters/pgn/${gameId}`);
        if (response && response.data) {
          const pgn = response.data as string;
          return {
            pgn,
            id: gameId,
            type: "masters",
          } as OTBGameData;
        }
      }
      throw new Error();
    },
  });

  const fetchGameAsync = async (
    gameid: string,
    gameType: "lichess" | "masters"
  ): Promise<string | undefined> => {
    if (gameType === "lichess") {
      const response = await axios.get(
        `https://lichess.org/game/export/${gameid}?pgnInJson=true`,
        {}
      );
      if (response && response.data?.pgn) return response.data.pgn as string;
    } else if (gameType === "masters") {
      const response = await axios.get(`https://explorer.lichess.ovh/masters/pgn/${gameid}`);
      if (response && response.data) return response.data as string;
    }
    return undefined;
  };
  return {
    database,
    setDatabase,
    lichessFilters,
    setLichessFilters,
    mastersFilters,
    setMastersFilters,
    otbGameLoading,
    fetchOTBGame,
    otbGame,
    data,
    error,
    isLoading: debounceSyncRef.current ? isLoading : true,
    sourceGame: currentGame,
    fetchGameAsync,
  };
}

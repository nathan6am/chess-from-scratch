import useSWR from "swr";

import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Chess from "@/lib/chess";
import { TreeNode } from "./useTreeData";
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
  "lichess" = "https://explorer.lichess.ovh/lichess?topGames=15",
  "masters" = "https://explorer.lichess.ovh/masters",
}

import _ from "lodash";
export interface ApiResponse {
  white: number;
  black: number;
  draws: number;
  moves: MoveData[];
  topGames: DBGameData[];
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

const reduceMoves = (history: Chess.MoveHistory): string =>
  history
    .flat()
    .filter(notEmpty)
    .map((halfMove) => Chess.MoveToUci(halfMove.move))
    .join(",");

const fetcher = async (game: Chess.Game, database: "lichess" | "masters") => {
  const fen = game.config.startPosition;
  const play = reduceMoves(game.moveHistory);
  const endpoint = Endpoints[database];
  const response = await axios.get(endpoint, {
    params: {
      fen,
      play,
    },
  });
  if (!response.data) throw new Error("No response data");
  return response.data as ApiResponse;
};

export interface ExplorerHook {
  database: "lichess" | "masters";
  setDatabase: (database: "lichess" | "masters") => void;
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
  const [mastersFilters, setMastersFilters] = useState<{}>({});
  const [lichessFilters, setLichessFilters] = useState<{}>({});
  const [gameId, fetchOTBGame] = useState<string | null>(null);
  //Debounce game state for api calls
  const debouncedGame = useDebounce(currentGame, 700);
  //Ref to set loading state when currentGame changes before debounced game upates
  const debounceSyncRef = useRef<boolean>(false);
  const prevGameRef = useRef<Chess.Game>(currentGame);
  useEffect(() => {
    if (_.isEqual(currentGame.fen, debouncedGame.fen)) debounceSyncRef.current = true;
    else {
      debounceSyncRef.current = false;
    }
  }, [currentGame, debouncedGame, debounceSyncRef]);
  const { data, error, isLoading } = useQuery({
    queryKey: ["explorer", debouncedGame, database],
    queryFn: () => fetcher(debouncedGame, database),
    keepPreviousData: true,
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
        const response = await axios.get(`https://lichess.org/game/export/${gameId}`, {});
        console.log(response);
        if (response && response.data) {
          const pgn = response.data as string;
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

  const fetchGameAsync = async (gameid: string, gameType: "lichess" | "masters"): Promise<string | undefined> => {
    if (gameType === "lichess") {
      const response = await axios.get(`https://lichess.org/game/export/${gameid}`, {});
      if (response && response.data) return response.data as string;
    } else if (gameType === "masters") {
      const response = await axios.get(`https://explorer.lichess.ovh/masters/pgn/${gameid}`);
      if (response && response.data) return response.data as string;
    }
    return undefined;
  };
  return {
    database,
    setDatabase,
    otbGameLoading,
    fetchOTBGame,
    otbGame,
    data,
    error,
    isLoading: debounceSyncRef.current ? isLoading : true,
    sourceGame: debouncedGame,
    fetchGameAsync,
  };
}

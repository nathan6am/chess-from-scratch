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
  "lichess" = "https://explorer.lichess.ovh/lichess",
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

const fetcher = async (game: Chess.Game) => {
  const fen = game.config.startPosition;
  const play = reduceMoves(game.moveHistory);
  const endpoint = Endpoints["masters"];
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
  sourceGame: Chess.Game;
  data: ApiResponse | undefined;
  error: unknown;
  isLoading: boolean;
  fetchOTBGame: (gameid: string) => void;
  otbGamePgn: string | null | undefined;
  otbGameLoading: boolean;
}

export default function useOpeningExplorer(currentGame: Chess.Game, options?: Partial<Options>): ExplorerHook {
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
    queryKey: ["explorer", debouncedGame],
    queryFn: () => fetcher(debouncedGame),
  });

  const {
    data: otbGamePgn,
    error: otbGameError,
    isLoading: otbGameLoading,
  } = useQuery({
    queryKey: ["otbgame", gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const response = await axios.get(`https://explorer.lichess.ovh/masters/pgn/${gameId}`);
      if (response && response.data) return response.data as string;
    },
  });
  return {
    otbGameLoading,
    fetchOTBGame,
    otbGamePgn,
    data,
    error,
    isLoading: debounceSyncRef.current ? isLoading : true,
    sourceGame: debouncedGame,
  };
}

import useSWR from "swr";

import axios from "axios";
import { useState } from "react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

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
export default function useOpeningExplorer(options?: Partial<Options>) {
  const { startFen, database, moves, topGames } = { ...defaultOptions, ...options };
  const [startPosition, setStartPosition] = useState<string>(startFen);
}

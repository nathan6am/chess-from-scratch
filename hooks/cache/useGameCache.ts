import { useLocalStorage } from "usehooks-ts";

interface CachedGame {
  pgn: string;
  key: string;
}

export default function useGameCache() {
  const [cachedGame, setCachedGame] = useLocalStorage<CachedGame | null>("cached-game", null);
  function clearCache() {
    setCachedGame(null);
  }
  function cacheGame(pgn: string, key: string) {
    setCachedGame({ pgn, key });
  }

  return { cachedGame, clearCache, cacheGame };
}

import { cache } from "react";
import { useLocalStorage } from "usehooks-ts";

interface CachedAnalysis {
  pgn: string;
  key: string;
}

export default function useAnalysisCache() {
  const [cachedAnalysis, setCachedAnalysis] = useLocalStorage<CachedAnalysis | null>("cached-analysis", null);
  function clearCache() {
    setCachedAnalysis(null);
  }
  function cacheAnalysis(pgn: string, key: string) {
    setCachedAnalysis({ pgn, key });
  }

  return { cachedAnalysis, clearCache, cacheAnalysis };
}

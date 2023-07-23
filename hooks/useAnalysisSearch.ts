import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import axios from "axios";
import type Analysis from "@/lib/db/entities/Analysis";
import { PGNTagData } from "@/lib/types";
import Collection from "@/lib/db/entities/Collection";
interface SearchParams {
  query?: string;
  sortBy?: "title" | "lastUpdate";
  sortDirection?: "ASC" | "DESC";
  page?: number;
  pageSize?: number;
}

const defaultSearchParams: SearchParams = {
  sortBy: "lastUpdate",
  sortDirection: "DESC",
  page: 1,
  pageSize: 15,
};
interface Options {
  searchParams?: SearchParams;
  onDeleted?: (analysisId: string) => void;
  onRenamed?: (analysisId: string, newName: string) => void;
  onCreated?: (analysis: Analysis) => void;
}
export default function useAnalysisSearch({ searchParams: _searchParams, onDeleted, onRenamed, onCreated }: Options) {
  const queryClient = useQueryClient();
  const searchParams = { ...defaultSearchParams, ..._searchParams };
  const { data, error, isLoading, fetchNextPage, isFetchingNextPage, hasNextPage, refetch } = useInfiniteQuery<
    Analysis[]
  >(["analyses", searchParams], {
    queryFn: async ({ pageParam }) => {
      const { data } = await axios.get(`/api/analysis/my-analyses`, {
        params: {
          ...defaultSearchParams,
          ...searchParams,
          page: pageParam || undefined,
        },
      });
      return data.analyses;
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage && lastPage.length < (defaultSearchParams.pageSize || 15)) return undefined;
      return pages.length + 1;
    },
    keepPreviousData: true,
  });

  const analyses = data?.pages.flat() || [];
  return {
    refetch,
    analyses,
    error,
    isLoading,
    loadMore: fetchNextPage,
    isLoadingMore: isFetchingNextPage,
    hasMore: hasNextPage,
  };
}

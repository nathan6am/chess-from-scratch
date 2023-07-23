import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { GameSearchOptions } from "@/lib/db/entities/User_Game";
import User_Game from "@/lib/db/entities/User_Game";
export default function useGameSearch(searchOptions: GameSearchOptions) {
  const { data, error, isLoading, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery<User_Game[]>(
    ["games", searchOptions],
    {
      queryFn: async ({ pageParam }) => {
        console.log(searchOptions, pageParam);
        const { data } = await axios.get(`/api/game/my-games`, {
          params: {
            before: searchOptions.before || undefined,
            after: searchOptions.after || undefined,
            pageSize: searchOptions.pageSize || undefined,
            page: pageParam || undefined,
            result: searchOptions.result?.join(",") || undefined,
            ratingCategory: searchOptions.ratingCategory?.join(",") || undefined,
            asColor: searchOptions.asColor || undefined,
          },
        });
        return data.games;
      },
      getNextPageParam: (lastPage, pages) => {
        if (lastPage && lastPage.length < (searchOptions.pageSize || 12)) return undefined;
        return pages.length + 1;
      },
    }
  );

  const games = data?.pages.flat() || [];
  return { games, error, isLoading, loadMore: fetchNextPage, isLoadingMore: isFetchingNextPage, hasMore: hasNextPage };
}

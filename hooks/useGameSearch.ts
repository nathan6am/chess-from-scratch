import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { GameSearchOptions } from "@/server/routes/game";
import User_Game from "@/lib/db/entities/User_Game";
export default function useGameSearch(searchOptions: GameSearchOptions) {
  const { data: games, error } = useQuery<User_Game[]>(["games", searchOptions], {
    queryFn: async () => {
      const { data } = await axios.get(`/api/game/my-games`, {
        data: { limit: 10, ...searchOptions },
      });
      return data.games;
    },
  });
  return { games, error };
}

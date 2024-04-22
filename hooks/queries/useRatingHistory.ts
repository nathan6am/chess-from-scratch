import { useQuery } from "@tanstack/react-query";
import * as Chess from "@/lib/chess";
interface SearchParams {
  from: string;
  ratingCategory: Chess.RatingCategory;
}

export default function useRatingHistory({ searchParams }: { searchParams: SearchParams }) {
  const { data, error, isLoading } = useQuery<Array<{ rating: number; date: Date }>>(
    ["ratingHistory", searchParams],
    async () => {
      const res = await fetch(
        `/api/user/rating-history?from=${searchParams.from}&ratingCategory=${searchParams.ratingCategory}`
      );
      return res.json();
    }
  );
}

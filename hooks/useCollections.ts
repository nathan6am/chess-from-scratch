import Analysis from "@/lib/db/entities/Analysis";
import Collection from "@/lib/db/entities/Collection";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export default function useCollections() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState<boolean>(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await axios.get<{ collections: Collection[]; all: Analysis[] }>(
        "/api/collections/my-collections"
      );
      if (!response || !response.data) throw new Error("Error fetching collections");
      return response.data;
    },
    keepPreviousData: true,
  });

  const { mutate: createNew } = useMutation({
    mutationFn: async (title: string) => {
      setCreating(true);
      const response = await axios.post<{ collection: Collection }>("/api/collections/create", {
        title,
      });
      if (!response || !response.data) throw new Error("Error fetching collections");
      return response.data;
    },
    onSuccess: (newData) => {
      //Optimistic update
      setCreating(false);
      if (data) {
        queryClient.setQueriesData(["collections"], {
          ...data,
          collections: [...data.collections, newData.collection],
        });
      }
      //Refetch to confirm
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  return {
    refetch,
    allAnalyses: data?.all || [],
    collections: data?.collections || [],
    isLoading,
    creating,
    error,
    createNew,
  };
}

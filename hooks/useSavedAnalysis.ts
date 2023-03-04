import React, { useState, useMemo } from "react";
import Analysis from "@/lib/db/entities/Analysis";
import Collection from "@/lib/db/entities/Collection";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PGNTagData } from "@/util/parsers/pgnParser";
export interface SavedAnalysis {
  id: string;
  title: string;
  description?: string;
  collectionIds: string[];
  tags: PGNTagData;
  moveText: string;
  pgn: string;
  forkedFrom?: any;
  visibility: "private" | "unlisted" | "public";
  readonly?: boolean;
}

const fetcher = async (id: string | null) => {
  if (!id) return null;
  const res = await axios.get<Analysis>(`/api/analysis/${id}`);
  if (res.data) {
    return res.data;
  } else {
    return null;
  }
};

//Hook for managing loading/saving analysis from DB
export default function useSavedAnalysis() {
  const [id, setId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetcher(id),
    keepPreviousData: true,
  });

  const load = (id: string) => {
    setId(id);
  };

  const save = () => {};
  const { mutate: saveAs } = useMutation({
    mutationFn: async (data: SavedAnalysis) => {
      const { id, readonly, forkedFrom, ...rest } = data;
      const response = await axios.post<Analysis>("/api/analysis/", { ...rest });
      if (response && response.data) return response.data as Analysis;
      else throw new Error("Save failed");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["analysis", id]);
      setId(data.id);
    },
  });
  const fork = () => {};
}

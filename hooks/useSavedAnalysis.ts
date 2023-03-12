import React, { useState, useMemo } from "react";
import Analysis from "@/lib/db/entities/Analysis";
import Collection from "@/lib/db/entities/Collection";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AnalysisData } from "./useAnalysisBoard";
export interface SavedAnalysis {
  analysis: Analysis;
  readonly?: boolean;
}

const fetcher = async (id: string | null) => {
  if (!id) return null;
  const res = await axios.get<{ analysis: Analysis; readonly: boolean }>(`/api/analysis/${id}`);
  if (res.data) {
    return res.data;
  } else {
    return null;
  }
};

//Hook for managing loading/saving analysis from DB
export default function useSavedAnalysis(initialId?: string) {
  const [id, setId] = useState<string | null>(initialId || null);
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { data, error, isLoading } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetcher(id),
    keepPreviousData: true,
    onError: () => {
      setId(null);
    },
  });

  const load = (id: string) => {
    setId(id);
  };

  const { mutate: save } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AnalysisData }) => {
      const response = await axios.put<Analysis>(`/api/analysis/${id}`, data);
      if (response && response.data) return response.data as Analysis;
      else throw new Error();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["analysis", id]);
      setId(data.id);
    },
  });
  const { mutate: saveAs } = useMutation({
    mutationFn: async (data: AnalysisData) => {
      const response = await axios.post<Analysis>("/api/analysis/", data);
      console.log(data);
      console.log(response);
      if (response && response.data) return response.data as Analysis;
      else throw new Error("Save failed");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["analysis", id]);
      setId(data.id);
    },
  });
  const { mutate: fork } = useMutation({
    mutationFn: async (data: { title: string; collectionIds: string[] }) => {
      const response = await axios.post<{ success: boolean; analysis: Analysis }>(
        `/api/analysis/${id}/fork`,
        data
      );
      if (response && response.data) return response.data.analysis;
      else throw new Error("Fork failed");
    },
    onSuccess: (data) => {
      setId(data.id);
    },
  });

  return {
    data,
    error,
    isLoading,
    save,
    saveAs,
    fork,
    load,
    id,
    autoSync,
    setAutoSync,
  };
}

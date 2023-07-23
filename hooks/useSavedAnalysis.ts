import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Analysis from "@/lib/db/entities/Analysis";
import Collection from "@/lib/db/entities/Collection";
import { SavedAnalysis, PGNTagData, AnalysisData } from "@/lib/types";
import { useRouter } from "next/router";
import _ from "lodash";
import useDebounce from "./useDebounce";
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
interface Args {
  pgn: string;
  tags: PGNTagData;
  shouldSync?: boolean;
}
export default function useSavedAnalysis({ pgn: _pgn, tags, shouldSync }: Args) {
  const pgn = useDebounce(_pgn, 1000);
  const router = useRouter();
  const id = router.query.id as string;
  const load = useCallback(
    (id: string | null) => {
      if (id === null) return router.replace(`/study/analyze`, undefined, { shallow: true });
      router.replace(`/study/analyze?id=${id}`, `/study/analyze?id=${id}`, { shallow: true });
    },
    [router]
  );
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const queryClient = useQueryClient();
  const { data, error, isLoading, isRefetching } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetcher(id),
    keepPreviousData: true,
    onError: () => {
      load(null);
    },
  });
  const remotePgn = data?.analysis.pgn;
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const synced = remotePgn === pgn;
  const syncStatus = useMemo(() => {
    if (!data) return "loading";
    if (synced) return "synced";
    return "unsynced";
  }, [data, synced, isRefetching]);
  const {
    mutate: save,
    isLoading: saveInProgress,
    isError: saveError,
  } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AnalysisData }) => {
      const response = await axios.put<Analysis>(`/api/analysis/${id}`, data);
      if (response && response.data) return response.data as Analysis;
      else throw new Error();
    },
    onSuccess: (data) => {
      queryClient.setQueriesData(["analysis", id], { analysis: data, readonly: false });
      queryClient.invalidateQueries(["analysis", id]);
      queryClient.refetchQueries(["analysis", id]);
      setIsSyncing(false);
      load(data.id);
    },
  });
  useEffect(() => {
    if (!data) return;
    if (!pgn) return;
    if (!tags) return;
    if (!data.analysis) return;
    if (isSyncing) return;
    if (!shouldSync) return;
    if (saveInProgress) return;
    if (saveError) return;
    if (data.analysis.id !== id) return;
    //Don't save if the debounced pgn isn't yet the same as the current pgn
    if (_pgn !== pgn) return;
    if (data.analysis.pgn !== pgn || !_.isEqual(data.analysis.tagData, tags)) {
      setIsSyncing(true);
      save({ id: data.analysis.id, data: { ...data.analysis, pgn, tagData: tags } });
    }
  }, [pgn, tags, autoSync, data, isSyncing, shouldSync, saveInProgress, saveError, id]);

  const { mutate: saveNew } = useMutation({
    mutationFn: async (data: AnalysisData) => {
      const response = await axios.post<Analysis>("/api/analysis/", data);
      if (response && response.data) return response.data as Analysis;
      else throw new Error("Save failed");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["analysis", id]);
      load(data.id);
    },
  });

  const { mutate: fork } = useMutation({
    mutationFn: async (data: { title: string; collectionIds: string[] }) => {
      const response = await axios.post<{ success: boolean; analysis: Analysis }>(`/api/analysis/${id}/fork`, data);
      if (response && response.data) return response.data.analysis;
      else throw new Error("Fork failed");
    },
    onSuccess: (data) => {
      load(data.id);
    },
  });

  return {
    data,
    error,
    isLoading,
    save,
    saveNew,
    fork,
    load,
    id,
    synced,
    syncStatus,
    autoSync,
    setAutoSync,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Analysis from "@/lib/db/entities/Analysis";
import axios from "axios";

export interface FileManager {
  renameCollection: (args: { collectionId: string; newName: string }) => void;
  isRenamingCollection: boolean;
  deleteCollection: (collectionId: string) => void;
  isDeletingCollection: boolean;
  renameAnalysis: (args: { analysisId: string; newName: string }) => void;
  isRenamingAnalysis: boolean;
  deleteAnalysis: (analysisId: string) => void;
  isDeletingAnalysis: boolean;
  forkAnalysis: (analysisId: string) => void;
  isForkingAnalysis: boolean;
  assignCollections: (args: { analysisId: string; collectionIds: string[] }) => void;
  isAssigningCollections: boolean;
}
interface Options {
  onLoad?: (analysis: Analysis) => void;
  onDeleted?: (analysisId: string) => void;
  onRenamed?: (analysisId: string, newName: string) => void;
  onCollectionRenamed?: (collectionId: string, newName: string) => void;
  onFork?: (analysis: Analysis) => void;
  onAssignedCollections?: (analysisId: string, collectionIds: string[]) => void;
}
export default function useFileManager({
  onDeleted,
  onRenamed,
  onCollectionRenamed,
  onFork,
  onAssignedCollections,
}: Options): FileManager {
  // Rename a collections
  const { mutate: renameCollection, isLoading: isRenamingCollection } = useMutation({
    mutationFn: async (args: { collectionId: string; newName: string }) => {
      const reponse = await axios.put(`/api/collections/${args.collectionId}`, { title: args.newName });
      return reponse.data;
    },
    onSuccess: (data, args) => {
      if (onCollectionRenamed) onCollectionRenamed(args.collectionId, args.newName);
    },
  });

  // Delete a collection
  const { mutate: deleteCollection, isLoading: isDeletingCollection } = useMutation({
    mutationFn: async (collectionId: string) => {
      const reponse = await axios.delete(`/api/collections/${collectionId}`);
      return reponse.data;
    },
    onSuccess: (data, collectionId) => {
      if (onDeleted) onDeleted(collectionId);
    },
  });

  // Rename an analysis
  const { mutate: renameAnalysis, isLoading: isRenaming } = useMutation({
    mutationFn: async (args: { analysisId: string; newName: string }) => {
      const reponse = await axios.put(`/api/analysis/${args.analysisId}`, { title: args.newName });
      return reponse.data;
    },
    onSuccess: (data, args) => {
      if (onRenamed) onRenamed(args.analysisId, args.newName);
    },
  });

  // Fork an analysis
  const { mutate: forkAnalysis, isLoading: isDuplicating } = useMutation({
    mutationFn: async (analysisId: string) => {
      const reponse = await axios.post(`/api/analysis/${analysisId}/fork`);
      const { analysis } = reponse.data;
      if (analysis) {
        return analysis as Analysis;
      }
      throw new Error("Failed to fork analysis");
    },
    onSuccess: (analysis) => {
      if (onFork) onFork(analysis);
    },
  });

  // Delete an analysis
  const { mutate: deleteAnalysis, isLoading: isDeleting } = useMutation({
    mutationFn: async (analysisId: string) => {
      const reponse = await axios.delete(`/api/analysis/${analysisId}`);
      return reponse.data;
    },
    onSuccess: (data, analysisId) => {
      if (onDeleted) onDeleted(analysisId);
    },
  });

  // Reassign an analysis to collections
  const { mutate: assignCollections, isLoading: isAssigningCollections } = useMutation({
    mutationFn: async (args: { analysisId: string; collectionIds: string[] }) => {
      const reponse = await axios.put(`/api/analysis/${args.analysisId}/assign-collections`, {
        collectionIds: args.collectionIds,
      });
      return reponse.data;
    },
    onSuccess: (data, args) => {
      if (onAssignedCollections) onAssignedCollections(args.analysisId, args.collectionIds);
    },
  });
  return {
    renameAnalysis,
    isRenamingAnalysis: isRenaming,
    renameCollection,
    isRenamingCollection,
    forkAnalysis,
    isForkingAnalysis: isDuplicating,
    deleteAnalysis,
    deleteCollection,
    isDeletingCollection,
    isDeletingAnalysis: isDeleting,
    assignCollections,
    isAssigningCollections,
  };
}

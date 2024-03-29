import React from "react";
import useCollections from "@/hooks/useCollections";
import { IoSaveSharp } from "react-icons/io5";
import FileBrowser from "./FileBrowser";
import { PanelHeader } from "@/components/base/Typography";
export default function SavedAnalyses() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-4 w-full">
        <PanelHeader>
          <IoSaveSharp className="mr-2 inline mb-0.5 text-lg" />
          Saved Analyses
        </PanelHeader>
      </div>
      <FileBrowser />
    </div>
  );
}

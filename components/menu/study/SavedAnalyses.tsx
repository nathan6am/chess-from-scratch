import React from "react";
import { IoSaveSharp } from "react-icons/io5";
import FileBrowser from "./FileBrowser";
import { PanelHeader } from "@/components/base/Typography";
import useAuth from "@/hooks/queries/useAuth";
import Link from "next/link";
export default function SavedAnalyses() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-4 w-full">
        <PanelHeader>
          <IoSaveSharp className="mr-2 inline mb-0.5 text-lg" />
          Saved Analyses
        </PanelHeader>
      </div>
      {user?.type === "guest" ? (
        <div className="w-full h-full grow relative">
          <p
            className="italic text-sm text-light-400 m-4 my-8 w-full text-center
        "
          >
            <Link href="/login" className="underline hover:text-light-300">
              Login
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="underline hover:text-light-300">
              make an account
            </Link>{" "}
            to save your analyses and access them from anywhere.
          </p>
        </div>
      ) : (
        <FileBrowser />
      )}
    </div>
  );
}

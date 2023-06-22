import SavedAnalyses from "@/components/menu/SavedAnalyses";
import Tools from "@/components/menu/Tools";
import React from "react";

export default function Study() {
  return (
    <>
      <div className="w-full h-full flex flex-col p-6 md:px-10 lg:px-16 bg-elevation-1 items-center">
        <div className="w-full h-full flex flex-col xl:flex-row gap-x-4">
          <div className="w-[26rem] h-fit shrink-0 mb-4">
            <Tools />
          </div>
          <div className="grow w-full flex flex-col items-center justify-center h-full justify-start gap-y-4">
            <SavedAnalyses />
          </div>
        </div>
      </div>
    </>
  );
}

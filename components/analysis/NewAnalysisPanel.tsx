import { AnalysisHook } from "@/hooks/useAnalysisBoard";
import React from "react";
import { FaChessBoard, FaArchive, FaPaste } from "react-icons/fa";
import { ImFolderUpload } from "react-icons/im";
import { BiSolidChess } from "react-icons/bi";

interface Props {
  analysis: AnalysisHook;
  boardRef: React.RefObject<HTMLDivElement>;
  boardEditor: any;
}
export default function NewAnalysisPanel() {
  return (
    <div className="bg-[#242424] w-full h-full">
      <div className="bg-white/[0.1] p-4">
        <h2>New Analysis</h2>
      </div>
      <div className="flex flex-col divide-y divide-white/[0.1]">
        <p className="p-6 border-b border-white/[0.1]">Make Moves or...</p>
        <button className="p-3 px-6  text-left text-white/[0.8] hover:text-white hover:bg-white/[0.1]">
          <FaChessBoard className="inline mr-2" />
          Set Up Board
        </button>
        <button className="p-3 px-6  text-left text-white/[0.8] hover:text-white hover:bg-white/[0.1]">
          <ImFolderUpload className="inline mr-2" />
          Import from PGN
        </button>
        <button className="p-3 px-6  text-left text-white/[0.8] hover:text-white hover:bg-white/[0.1]">
          <FaPaste className="inline mr-2" /> Paste Fen
        </button>
        <button className="p-3 px-6  text-left text-white/[0.8] hover:text-white hover:bg-white/[0.1]">
          <FaArchive className="inline mr-2" />
          Game Archive
        </button>
        <button className="p-3 px-6  text-left text-white/[0.8] hover:text-white hover:bg-white/[0.1]">
          Saved Analyses
        </button>
      </div>
    </div>
  );
}

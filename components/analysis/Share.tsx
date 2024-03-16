import React, { useCallback } from "react";
import html2canvas from "html2canvas";
import { MdContentCopy } from "react-icons/md";
import { AnalysisContext } from "./AnalysisBoard";
import { useContext } from "react";
import { toPng } from "html-to-image";
export default function Share() {
  const { analysis } = useContext(AnalysisContext);
  const { pgn, currentGame } = analysis;
  const { fen } = currentGame;
  const handleDownloadImage = useCallback(async () => {
    const node = document.getElementById("analysis-board");
    if (!node) return;
    toPng(node, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "board.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);
  return (
    <div className="w-full h-fit bg-[#202020] flex flex-col py-2">
      <button onClick={handleDownloadImage}>Download as Image</button>
      <div className="w-full px-2">
        <p className="px-1 text-sm opacity-50">PGN:</p>
        <textarea
          rows={3}
          className="w-full rounded-md border border-white/[0.2] bg-[#161616] px-2 py-1 text-sm text-white/[0.7]"
          value={pgn}
          disabled={true}
        ></textarea>
      </div>
      <div className="w-full px-2">
        <p className="px-1 text-sm opacity-50">FEN:</p>
        <div className="w-full flex flex-row overflow-hidden rounded-md text-xs border border-white/[0.2]">
          <div className="grow h-full bg-[#161616] py-2 px-2 text-white/[0.7]">
            <p className="truncate">{fen}</p>
          </div>
          <div className="h-inherit w-fit px-2 bg-white/[0.2] py-2 flex justify-center items-center text-white/[0.5]">
            <MdContentCopy />
          </div>
        </div>
      </div>
    </div>
  );
}

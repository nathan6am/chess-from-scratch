import React, { useCallback, useContext } from "react";

//Icons
import { MdContentCopy, MdImage } from "react-icons/md";
import { FaFileExport, FaLink } from "react-icons/fa";

//Context
import { AnalysisContext } from "./AnalysisBoard";

//Components
import { Tooltip } from "react-tooltip";
import { Button } from "@/components/base";

//Util
import { toPng } from "html-to-image";

export default function Share() {
  const { analysis, showModal } = useContext(AnalysisContext);
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
    <>
      <Tooltip
        id="copy-tooltip"
        openOnClick={true}
        style={{
          backgroundColor: "#161616",
          color: "#dddddd",
          opacity: "96%",
          padding: "0.25em 0.5em",
          zIndex: 300,
          backdropFilter: "blur(10px)",
          borderRadius: "0.25em",
          maxWidth: "30em",
        }}
      ></Tooltip>
      <div className="w-full h-fit bg-[#202020] flex flex-col py-2">
        <div className="w-full flex flex-row justify-between items-center px-2 gap-x-2">
          <Button
            size="sm"
            variant="neutral"
            iconClassName="mr-2"
            label="Download Image"
            icon={MdImage}
            onClick={handleDownloadImage}
          />
          <Button
            size="sm"
            variant="neutral"
            iconClassName="mr-2"
            label="Export PGN"
            icon={FaFileExport}
            onClick={() => {
              showModal("export");
            }}
          />
          <Button
            size="sm"
            variant="neutral"
            label="Get Link"
            icon={FaLink}
            iconClassName="mr-2"
            data-tooltip-content="Copied to Clipboard!"
            data-tooltip-id="copy-tooltip"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          />
        </div>
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
            <button
              data-tooltip-content="Copied to Clipboard!"
              data-tooltip-id="copy-tooltip"
              data-tooltip-delay-hide={1000}
              onClick={(e) => {
                navigator.clipboard.writeText(fen);
              }}
              className="h-inherit w-fit px-2 bg-elevation-5 hover:bg-elevation-6 py-2 flex justify-center items-center text-light-300 hover:text-gold-200"
            >
              <MdContentCopy />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

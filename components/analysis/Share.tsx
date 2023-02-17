import React from "react";
import html2canvas from "html2canvas";
import { MdContentCopy } from "react-icons/md";
interface Props {
  boardRef: React.RefObject<HTMLDivElement>;
  pgn: string;
  fen: string;
}
export default function Share({ boardRef, pgn, fen }: Props) {
  const handleDownloadImage = async () => {
    const element = boardRef.current;
    if (!element) return;
    const canvas = await html2canvas(element);

    const data = canvas.toDataURL("image/jpg");
    const link = document.createElement("a");

    if (typeof link.download === "string") {
      link.href = data;
      link.download = "image.jpg";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(data);
    }
  };
  return (
    <div className="w-full h-fit bg-[#202020] flex flex-col py-2">
      <button onClick={handleDownloadImage}>Share as Image</button>
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

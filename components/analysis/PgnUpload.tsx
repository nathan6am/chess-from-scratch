import React, { useState, useMemo } from "react";
import { parsePgn } from "@/util/parsers/pgnParser";
import { AiFillFileAdd, AiFillFile } from "react-icons/ai";
import { BsFileEarmarkCheckFill, BsFileEarmarkXFill } from "react-icons/bs";
import useDebounce from "@/hooks/useDebounce";
import Loading from "../base/Loading";
export default function PgnUpload({ loadPgn }: { loadPgn: (pgn: string) => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [pgnText, setPgnText] = useState<string | null>(null);
  const allowedExtensions = [".pgn"];
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const handleLoadFile = (e: ProgressEvent<FileReader>) => {
    const content = e.target?.result as string;
    setPgnText(content);
    setLoading(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const file = e.dataTransfer.files?.[0];

    if (file) {
      const { name } = file;
      const fileExtension = name.substring(name.lastIndexOf("."));

      if (allowedExtensions.includes(fileExtension.toLowerCase())) {
        const reader = new FileReader();
        reader.onload = handleLoadFile;
        reader.onloadstart = () => setLoading(true);
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress((e.loaded / e.total) * 100);
          }
        };
        reader.readAsText(file);
        setFileName(name);
      } else {
        alert("Invalid file extension. Please upload a PGN file.");
      }
    }
  };

  const debouncedPgnText = useDebounce(pgnText, 500);
  const parsedPgn = useMemo(() => {
    if (debouncedPgnText) {
      try {
        return parsePgn(debouncedPgnText);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [debouncedPgnText]);

  const validPgn = useMemo(() => parsedPgn !== null, [parsedPgn]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { name } = file;
      const fileExtension = name.substring(name.lastIndexOf("."));
      if (allowedExtensions.includes(fileExtension)) {
        const reader = new FileReader();
        reader.onloadstart = () => setLoading(true);
        reader.onload = handleLoadFile;
        reader.readAsText(file);
        setFileName(name);
      } else {
        alert("File type not supported!");
      }
    } else {
      setPgnText(null);
      console.error("");
    }
  };

  const error = debouncedPgnText && !validPgn ? true : false;

  return (
    <div className="flex flex-col items-center">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center w-full h-60 rounded-md bg-elevation-3 shadow-md border border-elevation-6"
      >
        <textarea
          value={pgnText || ""}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="Paste pgn here, or drag and drop a file to upload"
          className="h-full w-full bg-transparent px-2 resize-none"
        ></textarea>
        <div className="w-full bg-elevation-4">
          {loading ? (
            <Loading className="py-2" />
          ) : (
            <>
              {fileName ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex flex-row items-center mb-2">
                    {pgnText && validPgn ? (
                      <>
                        <BsFileEarmarkCheckFill className="text-2xl text-green-300 inline mr-2" /> PGN Uploaded.{" "}
                      </>
                    ) : (
                      <>
                        <BsFileEarmarkXFill className="text-2xl text-red-400 inline mr-2" />
                        Upload Failed
                      </>
                    )}
                  </div>

                  <p className="flex flex-row items-center text-sm">
                    <AiFillFile className="inline mr-1" />
                    {fileName}
                  </p>
                </div>
              ) : (
                <>
                  <label
                    className="w-full cursor-pointer p-4 inline text-md text-light-100 hover:text-gold-100 flex flex-row items-center group gap-y-2 focus:outline-none focus:ring-transparent appearance-none"
                    htmlFor="pgnFile"
                  >
                    <AiFillFileAdd className="inline text-white text-lg mr-2 opacity-50 group-hover:opacity-80" />
                    <span>Select a PGN file to upload</span>
                  </label>{" "}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <input type="file" name="pgnFile" id="pgnFile" onChange={handleFileInput} className="hidden" />
      {pgnText && validPgn && (
        <button
          className="w-full text-center mt-3 p-3 px-4 flex flex-row justify-center rounded-md bg-white/[0.05] text-left text-white/[0.8] hover:text-white hover:bg-white/[0.1] shadow-md"
          onClick={() => {
            if (pgnText && validPgn) {
              loadPgn(pgnText);
            }
          }}
        >
          Load PGN
        </button>
      )}
    </div>
  );
}

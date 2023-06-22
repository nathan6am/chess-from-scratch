import React, { useState, useMemo } from "react";
import { parsePgn } from "@/util/parsers/pgnParser";
import { AiFillFileAdd, AiFillFile } from "react-icons/ai";
import { BsFileEarmarkCheckFill, BsFileEarmarkXFill } from "react-icons/bs";
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
  const parsedPgn = useMemo(() => {
    if (pgnText) {
      try {
        return parsePgn(pgnText);
      } catch (e) {
        console.error(e);
        return null;
      }
    }
    return null;
  }, [pgnText]);

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

  return (
    <div className="flex flex-col items-center">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gold-100 rounded-lg"
      >
        {loading ? (
          <>Uploading...</>
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
                  className="cursor-pointer inline text-lg text-gold-200 hover:text-gold-100 flex flex-col items-center group gap-y-2"
                  htmlFor="pgnFile"
                >
                  <AiFillFileAdd className="inline text-white text-3xl opacity-50 group-hover:opacity-80" />
                  <span>Select a PGN file to upload</span>
                </label>{" "}
                <span className="text-sm text-white/[0.5]">or drag and drop a file here</span>
              </>
            )}
          </>
        )}
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

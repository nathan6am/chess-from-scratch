import { AnalysisContext } from "../analysis/AnalysisBoard";
import { useContext, useMemo, useState } from "react";
import Modal from "@/components/UIKit/Modal";
import { Toggle, Button, Input, Label } from "../UIKit";
import TextArea from "../UIKit/TextArea";
interface Props {
  isOpen: boolean;
  onClose: any;
}

interface Options {
  includeArrows: boolean;
  includeVariations: boolean;
  includeComments: boolean;
  annotate: boolean;
  includeTimeRemaining: boolean;
  includeNags: boolean;
  initialMoveCount: number;
}

function downloadPGN({ pgn, filename }: { pgn: string; filename?: string }) {
  const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename || "filename"}.pgn`;
  a.click();
  URL.revokeObjectURL(url);
}
export default function ExportPGNDialog({ isOpen, onClose }: Props) {
  const { analysis } = useContext(AnalysisContext);
  const [options, setOptions] = useState<Options>({
    includeArrows: true,
    includeVariations: true,
    includeComments: true,
    annotate: true,
    includeTimeRemaining: true,
    includeNags: true,
    initialMoveCount: 0,
  });

  const [filename, setFilename] = useState<string>("analysis");
  const pgn = "useMemo(() => {return analysis.exportPgn(options);}, [options, analysis.pgn])";
  const handleDownload = () => {
    downloadPGN({ pgn, filename: filename || "analysis" });
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="w-full max-w-2xl h-[80vh] flex flex-col items-start p-8 bg-elevation-2"
    >
      <h3 className="text-xl font-semibold w-full text-center text-gold-200">Export to PGN</h3>
      <Label className="text-left text-md">Preview</Label>
      <textarea
        rows={10}
        className="w-full my-3 rounded-md border border-white/[0.2] bg-[#161616] px-2 py-1 text-sm text-white/[0.7]"
        value={pgn}
        disabled={true}
      ></textarea>
      <div className="flex flex-col w-full mb-4">
        <Label className="text-left text-md mb-2">Export Options</Label>
        <Toggle
          label="Include Comments"
          checked={options.includeComments}
          onChange={(checked) => {
            setOptions((options) => ({ ...options, includeComments: checked }));
          }}
        />
        <Toggle
          label="Include Variations"
          checked={options.includeVariations}
          onChange={(checked) => {
            setOptions((options) => ({ ...options, includeVariations: checked }));
          }}
        />
        <Toggle
          label="Annotate"
          checked={options.annotate}
          onChange={(checked) => {
            setOptions((options) => ({ ...options, annotate: checked }));
          }}
        />

        <Toggle
          label="Include NAGs"
          checked={options.includeNags}
          disabled={!options.annotate}
          onChange={(checked) => {
            setOptions((options) => ({ ...options, includeNags: checked }));
          }}
        />
        <Toggle
          label="Include Arrows"
          checked={options.includeArrows}
          disabled={!options.annotate}
          onChange={(checked) => {
            setOptions((options) => ({ ...options, includeArrows: checked }));
          }}
        />

        <Toggle
          label="Include Time Remaining"
          checked={options.includeTimeRemaining}
          disabled={!options.annotate}
          onChange={(checked) => {
            setOptions((options) => ({ ...options, includeTimeRemaining: checked }));
          }}
        />
      </div>
      <Input
        containerClassName="max-w-md"
        label="Filename (.pgn)"
        value={filename}
        onChange={(e) => {
          setFilename(e.target.value);
        }}
      />

      <div className="flex flex-row w-full gap-x-4 my-4">
        <Button variant="neutral" label="Cancel" onClick={onClose} />
        <Button variant="primary" label="Download" onClick={handleDownload} />
      </div>
    </Modal>
  );
}

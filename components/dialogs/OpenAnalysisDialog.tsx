import FileBrowser from "@/components/menu/study/FileBrowser";

import { Modal, Button } from "@/components/base";

interface Props {
  isOpen: boolean;
  onClose: any;
}

export default function OpensAnalysisDialog({ isOpen, onClose }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="w-full max-w-2xl h-[80vh] flex flex-col py-0 px-0 sm:px-0 bg-elevation-2"
    >
      <h2 className="text-gold-200 font-bold text-xl my-3 text-center ">Saved Analyses</h2>
      <FileBrowser />
      <div className="flex flex-row justify-center p-4">
        <Button variant="neutral" onClick={onClose} label="Cancel" className="max-w-sm"></Button>
      </div>
    </Modal>
  );
}

import FileBrowser from "@/components/menu/FileBrowser";
import Modal from "@/components/UIKit/Modal";

interface Props {
  isOpen: boolean;
  onClose: any;
}

export default function OpensAnalysisDialog({ isOpen, onClose }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="w-full max-w-2xl h-[80vh] flex flex-col p-0 bg-elevation-2"
    >
      <FileBrowser />
    </Modal>
  );
}

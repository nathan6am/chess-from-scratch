import FileBrowser from "@/components/menu/FileBrowser";
import Modal from "@/components/base/Modal";

interface Props {
  isOpen: boolean;
  onClose: any;
}

export default function OpensAnalysisModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="w-full max-w-2xl h-[80vh]">
      <FileBrowser />
    </Modal>
  );
}

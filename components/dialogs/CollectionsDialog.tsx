import React, { useEffect } from "react";
import { Modal, Button } from "@/components/base";
import CollectionSelect from "../menu/study/CollectionSelect";
import Analysis from "@/lib/db/entities/Analysis";
import useCollections from "@/hooks/useCollections";

interface Props {
  isOpen: boolean;
  closeModal: () => void;
  selectedAnalysis: Analysis | null;
  onConfirm: (id: string, collections: string[]) => void;
}

export default function CollectionsDialog({ selectedAnalysis, isOpen, closeModal, onConfirm }: Props) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const { collections, isLoading, createNew } = useCollections();
  useEffect(() => {
    if (selectedAnalysis?.collections) {
      setSelected(selectedAnalysis.collections.map((c) => c.id));
    } else {
      setSelected([]);
    }
  }, [selectedAnalysis]);

  return (
    <Modal panelClassName="w-full max-w-md p-6 bg-elevation-2" isOpen={isOpen} onClose={closeModal}>
      <div className="text-center">
        <h2 className="font-semibold text-xl text-gold-200">Manage Collections</h2>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (selectedAnalysis) {
            onConfirm(selectedAnalysis.id, selected);
          }
        }}
      >
        <div className="flex flex-col text-left">
          <CollectionSelect
            selected={selected}
            setSelected={setSelected}
            collections={collections}
            isLoading={isLoading}
            createNew={createNew}
          />
          <div className="flex flex-row justify-end">
            <Button variant="neutral" label="Cancel" type="button" onClick={closeModal} className="mr-2" />
            <Button variant="primary" label="Save" type="submit" />
          </div>
        </div>
      </form>
    </Modal>
  );
}

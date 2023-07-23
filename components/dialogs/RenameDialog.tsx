import { useRef, useEffect } from "react";
import { Modal, Input, Button } from "../UIKit";
import { useForm } from "react-hook-form";
interface Props {
  isOpen: boolean;
  closeModal: () => void;
  onConfirm: (args: { name: string }) => void;
  currentName: string;
  isLoading?: boolean;
}
import { mergeRefs } from "@/util/misc";

interface FormValues {
  name: string;
}
export default function RenameDialog({ isOpen, closeModal, onConfirm, currentName, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      name: currentName,
    },
  });

  useEffect(() => {
    setValue("name", currentName);
  }, [currentName]);

  const inputRef = useRef<HTMLInputElement>(null);
  const { onChange, onBlur, name, ref } = register("name");
  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      initialFocus={inputRef}
      panelClassName="max-w-md p-6 bg-elevation-2 w-full"
    >
      <div className="text-center">
        <h2 className="font-semibold text-xl text-gold-200">Rename</h2>
      </div>
      <form onSubmit={handleSubmit(onConfirm)}>
        <Input
          label="Name"
          onChange={onChange}
          onBlur={onBlur}
          name={name}
          ref={mergeRefs([ref, inputRef])}
          onFocus={(e) => {
            e.target.select();
          }}
        />
        <div className="flex flex-row justify-end">
          <Button variant="neutral" label="Cancel" type="button" onClick={closeModal} className="mr-2" />
          <Button variant="primary" label="Rename" type="submit" isLoading={isLoading} loadingLabel="Renaming" />
        </div>
      </form>
    </Modal>
  );
}

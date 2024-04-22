import React, { useState } from "react";
import { Modal, Button, Input } from "@/components/base";
interface Props {
  isOpen: boolean;
  closeModal: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  title: string;
  confirmText: string;
  cancelText: string;
  isLoading?: boolean;
  loadingText?: string;
  passphrase?: string;
  passphraseMessage?: string;
}

export default function ConfirmationDialog({
  isOpen,
  closeModal,
  onConfirm,
  onCancel,
  message,
  title,
  confirmText,
  cancelText,
  isLoading,
  loadingText,
  passphrase,
  passphraseMessage,
}: Props) {
  const [password, setPassword] = useState<string>("");
  const disabled = passphrase ? password !== passphrase : false;
  return (
    <Modal isOpen={isOpen} onClose={closeModal} panelClassName="w-full max-w-md p-6 bg-elevation-2" showCloseButton>
      <div className="text-center ">
        <h2 className="font-semibold text-xl text-gold-200">{title}</h2>
      </div>
      <p className="my-4 text-left">{message}</p>
      <>
        {passphrase && (
          <>
            <p className="py-4 text-left text-light-200">{passphraseMessage}</p>
            <Input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </>
        )}
      </>
      <div className="flex flex-row justify-end">
        <Button onClick={onCancel} className="mr-2" variant="neutral" label={cancelText}></Button>
        <Button
          disabled={disabled}
          onClick={onConfirm}
          variant="danger"
          label={confirmText}
          isLoading={isLoading}
          loadingLabel={loadingText}
        ></Button>
      </div>
    </Modal>
  );
}

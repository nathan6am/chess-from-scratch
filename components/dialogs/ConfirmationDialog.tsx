import React, { useState } from "react";
import { Modal, Button } from "@/components/base";

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
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={closeModal} panelClassName="max-w-md p-6 bg-elevation-2" showCloseButton>
      <div className="text-center">
        <h2 className="font-semibold text-xl text-gold-200">{title}</h2>
      </div>
      <p className="my-4 text-left">{message}</p>
      <div className="flex flex-row justify-end">
        <Button onClick={onCancel} className="mr-2" variant="neutral" label={cancelText}></Button>
        <Button
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

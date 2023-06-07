import { Dialog, Transition } from "@headlessui/react";

//Framework
import React, { useState, useContext, useCallback, Fragment, useMemo } from "react";
import { PreferencesTabs } from "../Menus/content/Options";
interface Props {
  isOpen: boolean;
  closeModal: () => void;
}

export default function OptionsOverlay({ isOpen, closeModal }: Props) {
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={closeModal} unmount={false}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/[0.3]" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto ">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full h-[80vh] max-w-[1200px] mx-10  px-4 sm:px-8 transform overflow-show rounded-2xl bg-[#181818] py-10 text-left align-middle shadow-lg transition-all">
                  <Dialog.Title>Preferences</Dialog.Title>
                  <PreferencesTabs />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

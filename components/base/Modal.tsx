import React, { Fragment } from "react";
import { Transition, Dialog } from "@headlessui/react";
import classNames from "classnames";
import { twMerge } from "tailwind-merge";
interface Props {
  children: JSX.Element | string | Array<JSX.Element | string>;
  panelClassName?: string;
  overlayClassName?: string;
  isOpen: boolean;
  initialFocus?: React.MutableRefObject<HTMLElement | null>;
  onClose: () => void;
  dismissOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}
export default function Modal({
  isOpen,
  onClose,
  dismissOnOverlayClick,
  overlayClassName,
  panelClassName,
  children,
  initialFocus,
  showCloseButton,
}: Props) {
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-20"
          onClose={dismissOnOverlayClick ? () => {} : onClose}
          unmount={false}
          initialFocus={initialFocus}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className={twMerge("fixed inset-0 bg-black/[0.3]", overlayClassName)} />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto ">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className={twMerge(
                    "px-4 sm:px-8 transform overflow-show rounded-sm bg-elevation-2 py-10 align-middle shadow-lg transition-all",
                    panelClassName
                  )}
                >
                  {children}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

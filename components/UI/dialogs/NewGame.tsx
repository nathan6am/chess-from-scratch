import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useMemo, useState } from "react";
interface Props {
  onCreateLobby: (options: any) => void;
  isOpen: boolean;
  closeModal: () => void;
}
import TimeControlSelect from "../forms/TimeControlSelect";
import NumbericInput from "../NumbericInput";
import Toggle from "../Menus/content/Toggle";
export default function NewGame({ onCreateLobby, isOpen, closeModal }: Props) {
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
                <Dialog.Panel className="w-full max-w-lg  px-4 sm:px-8 transform overflow-hidden rounded-2xl bg-[#202020] py-10 text-left align-middle shadow-lg transition-all">
                  <Dialog.Title as="h3" className="text-2xl font-semibold text-center">
                    New Game
                  </Dialog.Title>
                  <div className="max-w-sm mx-auto">
                    <Toggle label="Rated" onChange={() => {}} />
                    <label>Time Control</label>
                    <TimeControlSelect />

                    <div className="flex flex-row justify-end mt-6">
                      <button onClick={closeModal} className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 w-36">
                        Cancel
                      </button>
                      <button
                        onClick={onCreateLobby}
                        className="py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 ml-4 w-36"
                      >
                        Start Game
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

function Content() {
  return (
    <div className="max-w-sm mx-auto">
      <Toggle label="Rated" onChange={() => {}} />
      <label>Time Control</label>
      <TimeControlSelect />
      <div className="flex flex-row justify-end mt-6">
        <button className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 w-36">Cancel</button>
        <button className="py-2 px-4 rounded-md bg-green-500 hover:bg-green-600 ml-4 w-36">Start Game</button>
      </div>
    </div>
  );
}

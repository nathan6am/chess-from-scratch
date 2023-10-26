import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/router";
import * as Chess from "@/lib/chess";
import { MdArrowDropUp, MdOutlineRestartAlt, MdAnalytics, MdExitToApp } from "react-icons/md";
import { Modal } from "@/components/UIKit";
interface Props {
  outcome: Chess.Outcome;
  isOpen: boolean;
  close: () => void;
}

enum MessageEnum {
  agreement = "by agreement.",
  timeout = "by timeout.",
  "timeout-w-insufficient" = "by timeout with insufficient material",
  repetition = "by 3-fold repition",
  "checkmate" = "by checkmate",
  "50-move-rule" = "by 50 move rule",
  "stalemate" = "by stalemate",
  "abandonment" = "by abandonment",
  "resignation" = "by resignation",
  "insufficient" = "by insufficient mating material",
}
export default function Result({ outcome, isOpen, close }: Props) {
  const title = useMemo(() => {
    switch (outcome?.result) {
      case "w":
        return `White Wins!`;

      case "b":
        return `Black Wins!`;
      case "d":
        return `Draw`;
    }
  }, [outcome]);
  function closeModal() {
    close();
  }
  const router = useRouter();
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/[0.45]" />
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
                <Dialog.Panel className="w-full max-w-md px-8 transform overflow-hidden rounded-2xl bg-[#202020] py-10 text-left align-middle shadow-lg transition-all">
                  <Dialog.Title as="h3" className="text-2xl font-semibold text-center">
                    {title}
                  </Dialog.Title>
                  <div className="mt-1 font-medium text-md text-center text-white/[0.7]">
                    {outcome && `${MessageEnum[outcome.by]}`}
                  </div>
                  <div className="text-center w-fit text-lg text-white my-8 py-4 px-6 bg-green-200/[0.25] border-2 border-green-300/[0.8] rounded-md mx-auto">
                    <p>
                      infundibulus (1520)
                      <span className="inline items-center text-green-400">
                        <MdArrowDropUp className="inline text-2xl mr-[-4px]" />
                        12
                      </span>
                    </p>
                  </div>
                  <div className="mt-10 flex flex-col space-y-3 px-8">
                    <button
                      type="button"
                      className="inline-flex justify-center items-center rounded-md border border-transparent bg-green-500/[0.5] px-4 py-2 font-medium text-white hover:bg-green-600/[0.5] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Rematch
                      <MdOutlineRestartAlt className="inline text-xl ml-1" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center items-center rounded-md border border-transparent bg-sepia/[0.6] px-4 py-2 font-medium text-white hover:bg-sepia/[0.5] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      Analyze Game
                      <MdAnalytics className="inline text-xl ml-1" />
                    </button>
                    <button
                      onClick={() => {
                        router.push("/play");
                      }}
                      type="button"
                      className="inline-flex justify-center items-center rounded-md border border-transparent bg-red-400/[0.6] px-4 py-2 font-medium text-white hover:bg-red-500/[0.5] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Exit to Menu
                      <MdExitToApp className="inline text-xl ml-1" />
                    </button>
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

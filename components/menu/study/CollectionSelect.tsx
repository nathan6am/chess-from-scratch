import { Fragment, useState, useRef, useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { AiFillFolderAdd, AiFillFolder } from "react-icons/ai";
import { IoMdAddCircleOutline, IoMdCheckmarkCircle } from "react-icons/io";
import { ScrollContainer } from "@/components/layout/GameLayout";
import { TbSelector } from "react-icons/tb";

import Collection from "@/lib/db/entities/Collection";
import { Input } from "@/components/base";
import { Label } from "@/components/base/Typography";
import classNames from "classnames";

interface Props {
  selected: string[];
  setSelected: (collections: string[]) => void;
  collections: Collection[];
  isLoading: boolean;
  createNew: (title: string) => void;
}
export default function CollectionSelect({ selected, setSelected, collections, isLoading, createNew }: Props) {
  const [title, setTitle] = useState("");
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded, inputRef]);
  return (
    <div className="w-full">
      <Listbox multiple value={selected} onChange={setSelected}>
        <div className="relative mt-1">
          <Listbox.Label>
            <Label>Collections</Label>
          </Listbox.Label>
          <Listbox.Button className="relative w-full cursor-pointer mt-1 mb-3 rounded-lg bg-[#303030] hover:bg-[#363636] py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 ">
            <span className="block truncate opacity-80">
              Add to Collections{" "}
              {selected.length > 0 && (
                <span className="bg-gold-300 ml-1 py-[2px] font-bold rounded-full px-3 text-xs">{selected.length}</span>
              )}
            </span>

            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <TbSelector className="text-xl text-gold-200 " />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute max-h-80 h-80 w-full flex flex-col rounded-md bg-[#303030] pb-1  shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ">
              <div className="w-full py-2 pt-3 bg-[#404040] rounded-t-md px-2">
                <div className="w-full bg-[#303030] rounded-md border border-white/[0.2] px-2 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(!expanded);
                      inputRef.current?.focus();
                    }}
                    className="py-2 px-4 w-full rounded-md  text-centertext-white/[0.8] hover:text-white"
                  >
                    New Collection
                    <AiFillFolderAdd className="inline ml-2" />
                  </button>
                  <div className="w-full flex flex-row items-start justify-between">
                    <Input
                      ref={inputRef}
                      verifying={isLoading}
                      containerClassName={classNames("w-full mb-1 mt-1", { hidden: !expanded })}
                      className="mb-0"
                      onKeyDown={(e) => {
                        if (e.code === "Space") {
                          e.stopPropagation();
                        }
                        if (e.code === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          if (title) createNew(title);
                          setTitle("");
                        }
                      }}
                      status={null}
                      error={null}
                      id="title"
                      placeholder="New collection name..."
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (title) createNew(title);
                        setTitle("");
                      }}
                      className={classNames("py-2 px-4 mt-1 rounded-md text-center text-white/[0.8] hover:text-white", {
                        hidden: !expanded,
                      })}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-full h-full grow relative">
                <ScrollContainer>
                  {collections.map((collection, idx) => (
                    <Listbox.Option
                      key={collection.id}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-white/[0.1] text-white" : "text-white/[0.8]"
                        }`
                      }
                      value={collection.id}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                            <AiFillFolder className="inline opacity-50 text-lg mr-2 " />
                            {collection.title}
                          </span>

                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 ">
                            {selected ? (
                              <IoMdCheckmarkCircle className="text-green-400 text-xl" />
                            ) : (
                              <IoMdAddCircleOutline className="text-white/[0.8] text-xl" />
                            )}
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </ScrollContainer>
              </div>
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

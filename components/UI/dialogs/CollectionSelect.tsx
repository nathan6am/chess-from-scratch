import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import useCollections from "@/hooks/useCollections";
import Collection from "@/lib/db/entities/Collection";
import Input from "../Input";

export default function CollectionSelect() {
  const { collections, isLoading, createNew } = useCollections();
  const [selected, setSelected] = useState<Collection | null>(null);
  const [title, setTitle] = useState("");
  return (
    <div className="w-full">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative mt-1">
          <Listbox.Label>Assignee:</Listbox.Label>
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-[#303030] py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate">{selected?.title}</span>
            {!selected && <span className="block truncate opacity-50">Add to a collection</span>}
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">+</span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute mt-1 max-h-40 w-full overflow-auto rounded-md bg-[#303030] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              <div className="w-full py-2 px-4">Create new</div>
              <Input
                onKeyDown={(e) => {
                  if (e.code === "Space") {
                    e.stopPropagation();
                  }
                }}
                status={null}
                error={null}
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
              />
              {collections.map((collection, idx) => (
                <Listbox.Option
                  key={collection.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                    }`
                  }
                  value={collection}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                        {collection.title}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">~</span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

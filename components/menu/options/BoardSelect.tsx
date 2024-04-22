import { Fragment, useMemo, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { TbSelector } from "react-icons/tb";
interface BoardTheme {
  label: string;
  value: string;
  previewClass: string;
}
const THEMES: BoardTheme[] = [
  {
    label: "Blue",
    value: "blue",
    previewClass: "board-preview-blue",
  },
  {
    label: "Default",
    value: "default",
    previewClass: "board-preview-default",
  },
  {
    label: "Purple",
    value: "purple",
    previewClass: "board-preview-purple",
  },
  {
    label: "Grayscale",
    value: "grayscale",
    previewClass: "board-preview-grayscale",
  },
  {
    label: "Club",
    value: "club",
    previewClass: "board-preview-club",
  },
  {
    label: "Oak/Walnut",
    value: "oak-walnut",
    previewClass: "board-preview-oak-walnut",
  },
  {
    label: "Maple/Mahogany",
    value: "maple-mahogany",
    previewClass: "board-preview-maple-mahogany",
  },
  {
    label: "Marble",
    value: "marble",
    previewClass: "board-preview-marble",
  },
  {
    label: "Marble 2",
    value: "marble-2",
    previewClass: "board-preview-marble-2",
  },
];
interface Props {
  value: string;
  onChange: (theme: string) => void;
}
export default function BoardSelect({ value, onChange }: Props) {
  const selected = useMemo(() => {
    return THEMES.find((theme) => theme.value === value);
  }, [value]);
  return (
    <div className="max-w-sm">
      <Listbox value={value} onChange={onChange}>
        <div className="relative mt-1">
          <Listbox.Label className="mb-3">Board Theme</Listbox.Label>
          <Listbox.Button className=" mt-2 relative w-full cursor-default rounded-lg bg-[#303030] py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <div className="flex flex-row items-center">
              <Preview className={selected?.previewClass || ""} />
              <span className="block truncate">{selected?.label}</span>
            </div>

            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <TbSelector className="text-xl opacity-70 cursor-pointer hover:opacity-90" />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="z-[50] absolute mt-1 max-h-[20em] w-full overflow-auto rounded-md bg-[#303030] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm scrollbar scrollbar-thumb-white/[0.2] scrollbar-rounded-sm scrollbar-thin scrollbar-track-[#161616] scrollbar-w-[8px] divide-y">
              {THEMES.map((theme, idx) => (
                <Listbox.Option
                  key={theme.value}
                  className={({ active, selected }) =>
                    `relative cursor-default select-none pr-4 ${selected ? "bg-white/[0.1]" : ""} ${
                      active ? "bg-white/[0.1] text-white" : "text-white/[0.8]"
                    }`
                  }
                  value={theme.value}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex flex-row items-center justify-start px-4 py-2 ">
                        <Preview className={theme.previewClass} />
                        <span className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}>
                          {theme.label}
                        </span>
                      </div>
                      {selected ? (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-amber-600">
                          <BsFillCheckCircleFill className="text-gold-200 text-lg" />
                        </span>
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

function Preview({ className }: { className: string }) {
  return (
    <div className={`flex flex-row ${className} mr-3`}>
      <div className="h-8 w-8 preview-square-light"></div>
      <div className="h-8 w-8 preview-square-dark"></div>
    </div>
  );
}

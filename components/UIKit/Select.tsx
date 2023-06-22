import { Fragment, useMemo, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { TbSelector } from "react-icons/tb";

interface Props<T> {
  value: T;
  onChange: (value: T) => void;
  options: { label: string; value: T; icon?: React.FC<any>; iconClassName?: string }[];
  className?: string;
}
export default function Select({ value, onChange, options, className }: Props<any>) {
  const selected = useMemo(() => options.find((option) => option.value === value), [value, options]);
  const Icon = selected?.icon;
  return (
    <div className={className}>
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-elevation-3 hover:bg-elevation-4 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 ">
            <div className="flex flex-row items-center">
              {Icon && (
                <span className={`inline mt-1 mr-2 text-lg text-ligh-200 `}>
                  <Icon className={selected?.iconClassName} />
                </span>
              )}
              <span className="block truncate text-light-200">{selected?.label}</span>
            </div>

            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <TbSelector className="text-xl text-gold-100 opacity-70 cursor-pointer hover:opacity-90" />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="z-[50] absolute mt-1 max-h-[20em] w-full overflow-auto rounded-md bg-elevation-3 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none  scrollbar scrollbar-thumb-white/[0.2] scrollbar-rounded-sm scrollbar-thin scrollbar-track-[#161616] scrollbar-w-[8px] divide-y">
              {options.map((option, idx) => (
                <SelectOption
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  icon={option.icon}
                  iconClassName={option.iconClassName}
                />
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

interface ButtonProps {
  selected?: { label: string; value: any; icon?: React.FC<any> };
  className?: string;
  iconClassName?: string;
}
export function SelectButton({ selected, className, iconClassName }: ButtonProps) {
  const Icon = selected?.icon;
  return (
    <Listbox.Button className=" mt-2 relative w-full cursor-default rounded-lg bg-elevation-3 hover:bg-elevation-4 py-3 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 ">
      <div className="flex flex-row items-center">
        {Icon && (
          <span className={`inline mt-1 mr-2 text-lg text-ligh-200 `}>
            <Icon className={iconClassName} />
          </span>
        )}
        <span className="block truncate">{selected?.label}</span>
      </div>

      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <TbSelector className="text-xl text-gold-100 opacity-70 cursor-pointer hover:opacity-90" />
      </span>
    </Listbox.Button>
  );
}

interface OptionProps {
  value: any;
  children?: JSX.Element | string | Array<JSX.Element | string>;
  label?: string;
  icon?: React.FC<any>;
  iconClassName?: string;
}
export function SelectOption({ label, value, children, icon: Icon, iconClassName }: OptionProps) {
  return (
    <Listbox.Option
      key={value}
      className={({ active, selected }) =>
        `relative cursor-default select-none pr-4 ${selected ? "" : ""} ${
          active ? "bg-elevation-4 text-light-100" : "text-light-200"
        }`
      }
      value={value}
    >
      {({ selected }) => (
        <>
          <div className="flex flex-row items-center justify-start px-4 py-2 ">
            {children}
            {Icon && (
              <span className={`inline mt-1 mr-2 text-lg  ${selected ? "text-ligh-200" : "text-light-300"}`}>
                <Icon className={iconClassName} />
              </span>
            )}
            <span className={`block truncate ${selected ? "text-light-100" : "text-light-200"}`}>{label}</span>
          </div>
          {selected ? (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gold-200">
              <BsFillCheckCircleFill className="text-gold-200 text-md" />
            </span>
          ) : null}
        </>
      )}
    </Listbox.Option>
  );
}

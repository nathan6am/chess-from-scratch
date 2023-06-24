import { Fragment, useMemo, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { twMerge } from "tailwind-merge";
import { TbSelector } from "react-icons/tb";
import { MdCheckBoxOutlineBlank, MdCheckBox, MdIndeterminateCheckBox } from "react-icons/md";
interface Props<T> {
  value: T[];
  onChange: (value: T[]) => void;
  options: { label: string; value: T; icon?: React.FC<any>; iconClassName?: string }[];
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  placeholder?: string;
  showSelectAll?: boolean;
}
export default function MultiSelect({
  value,
  onChange,
  options,
  className,
  placeholder,
  showSelectAll,
  buttonClassName,
  optionsClassName,
}: Props<any>) {
  const allSelected = useMemo(() => options.every((option) => value.includes(option.value)), [value, options]);
  const selectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((option) => option.value));
    }
  };
  return (
    <div className={className}>
      <Listbox value={value} onChange={onChange} multiple>
        <div className="relative">
          <Listbox.Button
            className={twMerge(
              "relative w-full cursor-default rounded-lg bg-elevation-3 hover:bg-elevation-4 py-1.5 border-2 border-transparent pl-3 pr-8 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 ",
              buttonClassName
            )}
          >
            <div className="flex flex-row items-center">
              <span className="block truncate text-light-l00">
                {value.length ? `${value.length} Selected` : <span className="text-light-300">{`None Selected`}</span>}
              </span>
            </div>

            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <TbSelector className="text-xl text-gold-100 opacity-70 cursor-pointer hover:opacity-90" />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options
              className={twMerge(
                "z-[50] absolute mt-1 max-h-[20em] w-full overflow-auto rounded-md bg-elevation-3 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none  scrollbar scrollbar-thumb-white/[0.2] scrollbar-rounded-sm scrollbar-thin scrollbar-track-[#161616] scrollbar-w-[8px] divide-y divide-light-400",
                optionsClassName
              )}
            >
              {showSelectAll && (
                <button
                  onClick={selectAll}
                  className="flex flex-row hover:bg-white/[0.1] w-full text-light-200 hover:text-light-100 items-center justify-start px-2 py-2"
                >
                  <span className="text-light-200 mr-1">
                    {allSelected ? (
                      <MdCheckBox className="text-gold-100 text-lg" />
                    ) : value.length ? (
                      <MdIndeterminateCheckBox className="text-gold-100 text-lg" />
                    ) : (
                      <MdCheckBoxOutlineBlank className="text-light-300 text-lg" />
                    )}
                  </span>
                  <span>Select All</span>
                </button>
              )}
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
    <Listbox.Button className="mt-1 relative w-full cursor-default rounded-lg bg-elevation-3 hover:bg-elevation-4 py-1.5 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 ">
      <div className="flex flex-row items-center">
        {Icon && (
          <span className={`inline mt-1 mr-2 text-lg text-ligh-200`}>
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
          active ? "bg-white/[0.1] text-light-100" : "text-light-200"
        }`
      }
      value={value}
    >
      {({ selected }) => (
        <>
          <div className="flex flex-row items-center justify-start pl-8 py-2 ">
            {children}

            <span className={`block truncate ${selected ? "text-light-100" : "text-light-200"}`}>{label}</span>
            {Icon && (
              <span className={`inline mt-1 ml-2 text-lg  ${selected ? "text-ligh-200" : "text-light-300"}`}>
                <Icon className={iconClassName} />
              </span>
            )}
          </div>
          <span className={`absolute inset-y-0 left-0 flex items-center pl-3`}>
            {selected ? (
              <MdCheckBox className="text-gold-200 text-lg" />
            ) : (
              <MdCheckBoxOutlineBlank className="text-light-300 text-lg" />
            )}
          </span>
        </>
      )}
    </Listbox.Option>
  );
}

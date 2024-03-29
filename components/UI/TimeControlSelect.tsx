import React, { useEffect } from "react";
import { TimeControl } from "@/lib/chess";
import { Select } from "../UIKit";
import _ from "lodash";
interface Category {
  label: string;
  id: string;
  options?: TimeControl[];
}

const CATEGORIES: Category[] = [
  {
    label: "Bullet",
    id: "bullet",
    options: [
      { timeSeconds: 60, incrementSeconds: 0 },
      { timeSeconds: 60, incrementSeconds: 1 },
      { timeSeconds: 120, incrementSeconds: 0 },
      { timeSeconds: 120, incrementSeconds: 1 },
    ],
  },
  {
    label: "Blitz",
    id: "blitz",
    options: [
      { timeSeconds: 60 * 3, incrementSeconds: 0 },
      { timeSeconds: 60 * 3, incrementSeconds: 2 },
      { timeSeconds: 60 * 5, incrementSeconds: 0 },
      { timeSeconds: 60 * 5, incrementSeconds: 3 },
    ],
  },
  {
    label: "Rapid",
    id: "rapid",
    options: [
      { timeSeconds: 60 * 10, incrementSeconds: 0 },
      { timeSeconds: 60 * 10, incrementSeconds: 5 },
      { timeSeconds: 60 * 15, incrementSeconds: 10 },
      { timeSeconds: 60 * 30, incrementSeconds: 0 },
    ],
  },
  {
    label: "Custom",
    id: "custom",
  },
];

import { useState } from "react";
import { Tab, RadioGroup } from "@headlessui/react";
import { Label, NumbericInput } from "../UIKit";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface Props {
  defaultTabIndex?: number;
  defaultOptionIndices?: number[];
  defaultCustom?: TimeControl;
  defaultValue?: TimeControl;
  setTimeControl: React.Dispatch<React.SetStateAction<TimeControl | undefined>>;
}
export default function TimeControlSelect({
  defaultTabIndex = 0,
  defaultOptionIndices = [0, 0, 0],
  defaultCustom = { timeSeconds: 300, incrementSeconds: 3 },
  setTimeControl,
}: Props) {
  const [lastSelected, setLastSelected] = useState(defaultOptionIndices);
  const [lastCustom, setLastCustom] = useState(defaultCustom);
  return (
    <div className="w-full max-w-md px-2 py-4 sm:px-0 h-[9rem]">
      <Tab.Group defaultIndex={defaultTabIndex}>
        <Tab.List className="flex rounded-lg overflow-hidden divide-x divide-gold-300 border border-gold-300 bg-elevation-2 ">
          {CATEGORIES.map((category, idx) => (
            <Tab
              onClick={() => {
                if (category.options) {
                  setTimeControl(category.options[lastSelected[idx] || 0]);
                } else {
                  setTimeControl(lastCustom);
                }
              }}
              key={category.id}
              className={({ selected }) =>
                classNames(
                  "w-full  py-2 text-md font-medium leading-5 text-white",
                  " focus:outline-none",
                  selected ? "bg-gold-300 text-light-100" : "text-gold-200"
                )
              }
            >
              {category.label}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {CATEGORIES.map((category, idx) => (
            <Tab.Panel key={category.id} className={"w-full mt-4 text-sm"}>
              {category.options?.length && (
                <OptionSelect
                  defaultOptionIndex={lastSelected[idx] || 0}
                  options={category.options}
                  onChange={(option) => {
                    setTimeControl(option);
                    const index = category.options?.findIndex((opt) => _.isEqual(opt, option));
                    if (index && index !== -1)
                      setLastSelected((current) => {
                        current[idx] = index;
                        return current;
                      });
                  }}
                />
              )}
              {category.id === "custom" && (
                <CustomSelect
                  onChange={(val) => {
                    setTimeControl(val);
                    setLastCustom(val);
                  }}
                  defaultValue={lastCustom}
                />
              )}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

function OptionSelect({
  options,
  onChange,
  defaultOptionIndex,
}: {
  options: TimeControl[];
  onChange: (option: TimeControl) => void;
  defaultOptionIndex: number;
}) {
  const [selected, setSelected] = useState(options[defaultOptionIndex]);
  return (
    <RadioGroup
      value={selected}
      onChange={(option: TimeControl) => {
        setSelected(option);
        onChange(option);
      }}
      className={"gap-4 grid grid-cols-4 w-full"}
    >
      {options.map((option, idx) => (
        <RadioGroup.Option value={option} key={idx}>
          {({ checked }) => (
            <div
              className={`bg-white/[0.1] text-center p-2 rounded-md cursor-pointer ${
                checked ? "bg-gold-300 " : "text-light-200 hover:bg-elevation-4"
              }`}
            >
              {option.timeSeconds / 60} + {option.incrementSeconds}
            </div>
          )}
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  );
}

interface CustomSelectProps {
  onChange: (option: TimeControl) => void;
  defaultValue?: TimeControl;
}

function CustomSelect({ onChange, defaultValue }: CustomSelectProps) {
  const [minutes, setMinutes] = useState(() => (defaultValue?.timeSeconds || 300) / 60);
  const [incrementSeconds, setIncrementSeconds] = useState(defaultValue?.incrementSeconds || 3);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
      <NumbericInput
        label="Minutes per side"
        min={0}
        max={90}
        value={minutes}
        onChange={(val: number) => {
          setMinutes(val);
          onChange({
            timeSeconds: val * 60,
            incrementSeconds,
          });
        }}
      />
      <NumbericInput
        label="Increment (s)"
        min={0}
        max={60}
        value={incrementSeconds}
        onChange={(val: number) => {
          setIncrementSeconds(val);
          onChange({
            timeSeconds: minutes * 60,
            incrementSeconds: val,
          });
        }}
      />
    </div>
  );
}

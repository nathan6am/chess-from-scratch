import React from "react";
import { TimeControl } from "@/lib/chess";

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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TimeControlSelect() {
  const [timeControl, setTimeControl] = useState<TimeControl>();
  return (
    <div className="w-full max-w-md px-2 py-4 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-[#161616] p-1">
          {CATEGORIES.map((category) => (
            <Tab
              key={category.id}
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-md font-medium leading-5 text-white",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-[#1f1f1f] focus:outline-none focus:ring-2",
                  selected ? "bg-[#b99873] shadow" : "text-white/[0.7] hover:bg-white/[0.12] hover:text-white"
                )
              }
            >
              {category.label}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          {CATEGORIES.map((category, idx) => (
            <Tab.Panel key={category.id} className={"w-full mt-4 text-sm p-4 bg-white/[0.1] rounded-xl"}>
              {category.options?.length && <OptionSelect options={category.options} />}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

function OptionSelect({ options }: { options: TimeControl[] }) {
  const [selected, setSelected] = useState(options[0]);
  return (
    <RadioGroup value={selected} onChange={setSelected} className={"gap-4 grid grid-cols-4 w-full"}>
      {options.map((option, idx) => (
        <RadioGroup.Option value={option} key={idx}>
          {({ checked }) => (
            <div
              className={`bg-white/[0.1] text-center p-2 rounded-md cursor-pointer ${
                checked
                  ? "bg-white/[0.3] ring-2 ring-offset-2 ring-offset-[#202020] ring-opacity-60 ring-green-400 "
                  : "text-white/[0.7] hover:bg-sepia/[0.3]"
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

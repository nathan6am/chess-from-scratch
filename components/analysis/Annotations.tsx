//Framework
import React, { useState, Fragment, useMemo, useCallback } from "react";

//Types
import { ArrowColor, TreeNode } from "@/lib/types";

//Components
import { Listbox, Transition, RadioGroup } from "@headlessui/react";

//Icons
import { MdCheck, MdEditNote } from "react-icons/md";
import { CgRemoveR } from "react-icons/cg";
import * as Chess from "@/lib/chess";

//Util
import { ColorEnum } from "./BoardArrows";
import classNames from "classnames";

//Numbered Annotation Glyphs
export interface NAG {
  code: number;
  description: string;
  unicode: string;
  className?: string;
}

interface Props {
  node: TreeNode<Chess.NodeData> | null;
  controls: {
    updateAnnotations: (nodeKey: string, code: number[]) => void;
    updateComment: (nodeKey: string, comment: string) => void;
  };
  markupControls: {
    color: ArrowColor;
    setSelectedColor: (color: ArrowColor) => void;
    clear: () => void;
    locked: boolean;
    toggleLocked: () => void;
  };
}

export default function Annotations({ node, controls, markupControls }: Props) {
  const selectedAnnotations = useMemo(() => {
    return node?.data.annotations || [];
  }, [node, node?.data.annotations]);

  //Uptate annotations for current node
  const updateAnnotations = useCallback(
    (annotations: number[]) => {
      if (!node) return;
      controls.updateAnnotations(node.key, annotations);
    },
    [node, controls]
  );

  return (
    <div className="p-3 bg-[#202020]">
      <MarkupControls
        selectedColor={markupControls.color}
        setSelectedColor={markupControls.setSelectedColor}
        clear={markupControls.clear}
        locked={markupControls.locked}
        toggleLocked={markupControls.toggleLocked}
      />
      <div className="flex flex-row items-center">
        <AnnotationSelect
          updateAnnotations={updateAnnotations}
          selected={selectedAnnotations}
          disabled={!node}
        />
        <a
          data-tooltip-id="my-tooltip"
          data-tooltip-content="Clear all"
          data-tooltip-place="right"
          onClick={() => {
            updateAnnotations([]);
          }}
          className="text-red-400 hover:text-red-500 cursor-pointer"
        >
          <CgRemoveR className="inline ml-1" />
        </a>
      </div>
    </div>
  );
}

interface SelectProps {
  selected: number[];
  disabled?: boolean;
  updateAnnotations: (annotations: number[]) => void;
}
function AnnotationSelect({ selected, updateAnnotations, disabled }: SelectProps) {
  const onChange = useCallback(
    (values: number[]) => {
      const valueAdded = values.find((value) => !selected.includes(value));
      if (!valueAdded) {
        updateAnnotations(values);
      } else {
        const category = annotationCategories.find((category) =>
          category.options.some((option) => option.code === valueAdded)
        );
        if (!category || category.allowMultiple) {
          updateAnnotations(values);
        } else {
          const filterValues = category.options.map((option) => option.code);
          updateAnnotations(
            values.filter((value) => value === valueAdded || !filterValues.includes(value))
          );
        }
      }
    },
    [selected, updateAnnotations]
  );
  return (
    <div className=" w-60">
      <Listbox value={selected} onChange={onChange} multiple>
        <div className="relative mt-1">
          <Listbox.Button className="text-white/[0.8] text-sm relative w-full cursor-pointer rounded-lg bg-white/[0.1] py-2 pl-3 pr-10 text-left shadow-md focus:outline-none hover:bg-white/[0.2] hover:text-white">
            Annotate With Glyphs
            <>
              {selected.length > 0 && (
                <span className="inline px-2 text-sm bg-amber-600 ml-2 rounded-lg">
                  {selected.length}
                </span>
              )}
            </>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <MdEditNote className="h-5 w-5" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="w-[25em] absolute mb-1  bottom-full max-h-[40em] w-full overflow-auto rounded-md bg-[#404040] py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {annotationCategories.map((category, idx) => (
                <div key={idx} className="border-b mb-2">
                  <p className="opacity-50 px-4 py-1">{category.name}</p>
                  <>
                    {category.options.map((option) => (
                      <Listbox.Option
                        key={option.code}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-8 pr-4 ${
                            active ? "bg-white/[0.1] text-white" : "text-white/[0.8]"
                          }`
                        }
                        value={option.code}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              <span className="inline text-sepia mr-1">{option.unicode}</span>
                              {option.description}
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-green-500">
                                <MdCheck />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </>
                </div>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
interface MarkupControlProps {
  selectedColor: ArrowColor;
  setSelectedColor: (color: ArrowColor) => void;
  clear: () => void;
  locked: boolean;
  toggleLocked: () => void;
}
function MarkupControls({
  selectedColor,
  setSelectedColor,
  clear,
  locked,
  toggleLocked,
}: MarkupControlProps) {
  return (
    <div className="w-full">
      <RadioGroup value={selectedColor} onChange={setSelectedColor}>
        <label className="text-sm opacity-60">Arrow Color</label>
        <div className="flex flex-row w-fit bg-[#303030] shadow-md p-2 rounded-md">
          {Object.entries(ColorEnum).map(([key, value]) => (
            <RadioGroup.Option value={key} key={key}>
              {({ active, checked }) => (
                <div
                  className={classNames("h-6 w-6 rounded-sm cursor-pointer mx-2", {
                    "border-2 border-white/[0.8]": checked,
                    "border-2 border-white/[0.3]": active && !checked,
                  })}
                  style={{ backgroundColor: value }}
                ></div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}

//ANNOTATION CATEGORIES
interface AnnotationCategory {
  name: string;
  allowMultiple: boolean;
  options: NAG[];
}
const annotationCategories: AnnotationCategory[] = [
  {
    name: "Move Classification",
    allowMultiple: false,
    options: [
      {
        code: 1,
        description: "Good Move",
        unicode: "\u0021",
      },
      {
        code: 2,
        description: "Mistake",
        unicode: "\u003F",
      },
      {
        code: 3,
        description: "Brilliant Move",
        unicode: "\u203C",
      },
      {
        code: 4,
        description: "Blunder",
        unicode: "\u2047",
      },
      {
        code: 5,
        description: "Interesting Move",
        unicode: "\u2049",
      },
      {
        code: 6,
        description: "Dubious Move",
        unicode: "\u2048",
      },
      {
        code: 7,
        description: "Forced Move",
        unicode: "\u25A1",
      },
    ],
  },
  {
    name: "Positional Assesments",
    allowMultiple: false,
    options: [
      {
        code: 10,
        description: "Equal Position",
        unicode: "\u003D",
      },
      {
        code: 13,
        description: "Unclear Position",
        unicode: "\u221E ",
      },
      {
        code: 14,
        description: "White has slight advantage",
        unicode: "\u2A72",
      },
      {
        code: 15,
        description: "Black has slight advantage",
        unicode: "\u2A71",
      },
      {
        code: 16,
        description: "White has moderate advantage",
        unicode: "\u00B1",
      },
      {
        code: 17,
        description: "Black has moderate advantage",
        unicode: "\u2213",
      },
      {
        code: 18,
        description: "White has decisive advantage",
        unicode: "\u002B\u002D",
      },
      {
        code: 19,
        description: "Black has decisive advantage",
        unicode: "\u002D\u002B",
      },
    ],
  },
  {
    name: "Other Annotations",
    allowMultiple: true,
    options: [
      {
        code: 22,
        description: "Zugzwang (white)",
        unicode: "\u2A00",
      },
      {
        code: 23,
        description: "Zugzwang (black)",
        unicode: "\u2A00",
      },
      {
        code: 26,
        description: "Space sdvantage (white)",
        unicode: "\u25CB ",
      },
      {
        code: 27,
        description: "Space sdvantage (black)",
        unicode: "\u25CB ",
      },
      {
        code: 32,
        description: "Time/development Advantage (white)",
        unicode: "\u27F3  ",
      },
      {
        code: 33,
        description: "Time/development Advantage (black)",
        unicode: "\u27F3  ",
      },
      {
        code: 36,
        description: "Initiative (white)",
        unicode: "\u2191",
      },
      {
        code: 37,
        description: "Initiative (black)",
        unicode: "\u2191",
      },
      {
        code: 40,
        description: "White has the attack",
        unicode: "\u2192",
      },
      {
        code: 41,
        description: "Black has the attack",
        unicode: "\u2192",
      },
      {
        code: 132,
        description: "Counterplay (white)",
        unicode: "\u21C6",
      },
      {
        code: 133,
        description: "Counterplay (black)",
        unicode: "\u21C6",
      },
    ],
  },
];
const dictionary = [
  {
    code: 1,
    description: "Good Move",
    unicode: "\u0021",
    className: "text-green-400",
  },
  {
    code: 2,
    description: "Mistake",
    unicode: "\u003F",
    className: "text-amber-400",
  },
  {
    code: 3,
    description: "Brilliant Move",
    unicode: "\u203C",
    className: "text-teal-400",
  },
  {
    code: 4,
    description: "Blunder",
    unicode: "\u2047",
    className: "text-red-400",
  },
  {
    code: 5,
    description: "Interesting Move",
    unicode: "\u2049",
    className: "text-purple-400",
  },
  {
    code: 6,
    description: "Dubious Move",
    unicode: "\u2048",
    className: "text-fuchsia-400",
  },
  {
    code: 7,
    description: "Forced Move",
    unicode: "\u25A1",
  },

  {
    code: 10,
    description: "Equal Position",
    unicode: "\u003D",
  },
  {
    code: 13,
    description: "Unclear Position",
    unicode: "\u221E ",
  },
  {
    code: 14,
    description: "White has slight advantage",
    unicode: "\u2A72",
  },
  {
    code: 15,
    description: "Black has slight advantage",
    unicode: "\u2A71",
  },
  {
    code: 16,
    description: "White has moderate advantage",
    unicode: "\u00B1",
  },
  {
    code: 17,
    description: "Black has moderate advantage",
    unicode: "\u2213",
  },
  {
    code: 18,
    description: "White has decisive advantage",
    unicode: "\u002B\u002D",
  },
  {
    code: 19,
    description: "Black has decisive advantage",
    unicode: "\u002D\u002B",
  },
  {
    code: 22,
    description: "Zugzwang (white)",
    unicode: "\u2A00",
  },
  {
    code: 23,
    description: "Zugzwang (black)",
    unicode: "\u2A00",
  },
  {
    code: 26,
    description: "Space sdvantage (white)",
    unicode: "\u25CB ",
  },
  {
    code: 27,
    description: "Space sdvantage (black)",
    unicode: "\u25CB ",
  },
  {
    code: 32,
    description: "Time/development Advantage (white)",
    unicode: "\u27F3  ",
  },
  {
    code: 33,
    description: "Time/development Advantage (black)",
    unicode: "\u27F3  ",
  },
  {
    code: 36,
    description: "Initiative (white)",
    unicode: "\u2191",
  },
  {
    code: 37,
    description: "Initiative (black)",
    unicode: "\u2191",
  },
  {
    code: 40,
    description: "White has the attack",
    unicode: "\u2192",
  },
  {
    code: 41,
    description: "Black has the attack",
    unicode: "\u2192",
  },
  {
    code: 132,
    description: "Counterplay (white)",
    unicode: "\u21C6",
  },
  {
    code: 133,
    description: "Counterplay (black)",
    unicode: "\u21C6",
  },
];

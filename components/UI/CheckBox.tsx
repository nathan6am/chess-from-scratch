import { useState, useMemo } from "react";
import { Switch } from "@headlessui/react";
import { MdCheckBoxOutlineBlank, MdCheckBox, MdIndeterminateCheckBox } from "react-icons/md";

interface Props {
  onChange: (enabled: boolean) => any;
  label?: string;
  checked?: boolean;
  indeterminate?: boolean;
  srLabel?: string;
  labelClasses?: string;
  disabled?: boolean;
  className?: string;
}
export default function CheckBox({
  label,
  checked,
  onChange,
  srLabel,
  labelClasses,
  className,
  indeterminate,
  disabled,
}: Props) {
  return (
    <div className={className}>
      <Switch checked={checked} onChange={onChange} disabled={disabled}>
        {({ checked }) => (
          <div className={`flex flex-row items-center cursor-pointer`}>
            <span
              className={
                disabled ? "text-[#8c8c8c]" : `${checked || indeterminate ? "text-gold-300" : "text-white/[0.5]"}`
              }
            >
              <CheckBoxIcon checked={checked} indeterminate={indeterminate} disabled={disabled} />
            </span>
            {label && (
              <label className={` ${disabled ? "text-[#7c7c7c]" : ""} ${labelClasses} ml-2 mb-[1px] cursor-pointer`}>
                {label}
              </label>
            )}
          </div>
        )}
      </Switch>
    </div>
  );
}

function CheckBoxIcon({
  checked,
  indeterminate,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
}) {
  if (indeterminate)
    return (
      <div className="h-[20px] w-[20px] relative">
        <div
          className={`absolute top-[0.2em] left-[0.2em] right-[0.2em] bottom-[0.2em] ${
            disabled ? "bg-white/[0.8]" : "bg-white"
          } z-0`}
        ></div>
        <MdIndeterminateCheckBox className="z-[10] absolute top-0 left-0 right-0 bottom-0 text-xl" />
      </div>
    );
  return (
    <>
      {checked ? (
        <div className="h-[20px] w-[20px] relative">
          <div
            className={`absolute top-[0.2em] left-[0.2em] right-[0.2em] bottom-[0.2em] ${
              disabled ? "bg-white/[0.8]" : "bg-white"
            } z-0`}
          ></div>
          <MdCheckBox className="z-[10] absolute top-0 left-0 right-0 bottom-0 text-xl" />
        </div>
      ) : (
        <MdCheckBoxOutlineBlank className="text-xl" />
      )}
    </>
  );
}

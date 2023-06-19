import React from "react";
import { RadioGroup } from "@headlessui/react";
interface Props {
  disabled?: boolean;
  value: any;
  label: string;
  className?: string;
}
export default function RadioButton({ label, value, className, disabled }: Props) {
  return (
    <RadioGroup.Option value={value} disabled={disabled}>
      {({ checked, disabled }) => (
        <div
          className={`flex flex-row items-center group cursor-pointer my-1 ${
            disabled ? "pointer-none opacity-50" : ""
          } ${className || ""}`}
        >
          <div
            className={`rounded-full border-2 h-[20px] w-[20px] ${
              checked ? "border-gold-200" : "border-light-200"
            } p-1 mr-3`}
          >
            <div
              className={`${
                checked ? "bg-gold-200" : "bg-transparent group-hover:bg-white/[0.4]"
              } rounded-full w-full h-full`}
            />
          </div>
          <p className="text-light-100">{label}</p>
        </div>
      )}
    </RadioGroup.Option>
  );
}

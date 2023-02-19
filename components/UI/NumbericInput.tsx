import React, { useState } from "react";
import { IoMdArrowDropup, IoMdArrowDropdown } from "react-icons/io";
interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  className?: string;
  min?: number;
  max?: number;
  value: number;
  onChange: (val: number) => void;
}
export default function NumbericInput({ value, min, max, onChange, label, className }: Props) {
  const increment = () => {
    if (!max || value < max) {
      onChange(value + 1);
    }
  };
  const decrement = () => {
    if (min === undefined || value > min) {
      onChange(value - 1);
    }
  };
  return (
    <div className={className}>
      {label && <label className="text-sm mb-2 opacity-50">{label}</label>}
      <div className="relative w-40 overflow-hidden rounded-md overflow-hidden ring-white/[0.2] mt-1">
        <div className="absolute top-0 bottom-0 right-0 h-full w-8 grid grid-rows-2 bg-[#121212]  border-white/[0.2]">
          <div
            onClick={increment}
            className="flex items-center justify-center cursor-pointer bg-white/[0.03] hover:bg-white/[0.05]"
          >
            <IoMdArrowDropup />
          </div>
          <div
            onClick={decrement}
            className="flex items-center justify-center cursor-pointer bg-white/[0.03] hover:bg-white/[0.05]"
          >
            <IoMdArrowDropdown />
          </div>
        </div>
        <input
          onChange={(e) => {
            const re = /^[0-9\b]+$/;

            // if value is not blank, then test the regex
            if (e.target.value === "") onChange(0);
            if (re.test(e.target.value)) onChange(parseInt(e.target.value));
          }}
          onBlur={() => {
            if (max && value > max) {
              onChange(max);
            }
            if (min && value < min) {
              onChange(min);
            }
          }}
          //type="number"
          value={value}
          pattern="\d*"
          placeholder="0"
          className="p-2 bg-[#121212] rounded-md focus:outline-none"
        ></input>
      </div>
    </div>
  );
}

import React, { useState } from "react";
interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className: string;
}
export default function NumbericInput() {
  const [value, setValue] = useState<string>("");
  const increment = () => {
    setValue((cur) => `${parseInt(cur) + 1}`);
  };
  const decrement = () => {
    setValue((cur) => `${parseInt(cur) - 1}`);
  };
  return (
    <div className="relative w-fit overflow-hidden rounded-md ring-white/[0.2]">
      <div className="absolute top-0 bottom-0 right-0 h-full w-8 grid grid-rows-2 bg-[#121212] border-l-2 border-white/[0.2]">
        <div></div>
        <div></div>
      </div>
      <input
        onChange={(e) => {
          const re = /^[0-9\b]+$/;

          // if value is not blank, then test the regex

          if (e.target.value === "" || re.test(e.target.value)) setValue(e.target.value);
        }}
        //type="number"
        value={value}
        pattern="\d*"
        placeholder="0"
        className="p-2 bg-[#121212] rounded-md focus:outline-none"
      ></input>
    </div>
  );
}

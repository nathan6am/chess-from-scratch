import React, { MouseEventHandler } from "react";

interface ButtonProps {
  onClick?: MouseEventHandler;
  disabled?: boolean;
  children?: JSX.Element;
  className?: string;
}
export default function Button({ onClick, disabled, children, className }: ButtonProps) {
  return (
    <button
      className={`group rounded-md text-white bg-gradient-to-b from-[#363636] to-[#313131] w-full max-w-80 rounded-md text-lg shadow ${className}`}
      onClick={onClick}
    >
      <div className="justify-center text-center w-full h-full py-4 px-6 text-lg flex flex-row hover:bg-sepia/[0.2] rounded-md">
        {children && children}
      </div>
    </button>
  );
}

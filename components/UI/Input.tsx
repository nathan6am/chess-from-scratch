import { identity } from "lodash";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error: string | null;
  status: "success" | "warning" | "error" | null;
  label?: string;
  id: string;
}

export default function Input({ id, label, error, status, ...props }: InputProps) {
  return (
    <div className="mb-4 w-full">
      {label && (
        <label className="block text-white/[0.6] text-md font-semibold mb-2" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        className={`${
          status === "error" ? "border-red-400" : "border-white/[0.3]"
        } shadow appearance-none border-2 focus:border-white/[0.8] border-box rounded-md w-full py-3 px-3 text-lg bg-black/[0.3] text-sepia placeholder:text-gray-300 leading-tight focus:outline-none`}
        id={id}
        {...props}
      />
      {error && <p className="text-red-400 text-sm mt-1 text-left ml-2">{error}</p>}
    </div>
  );
}

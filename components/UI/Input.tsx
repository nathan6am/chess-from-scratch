import { identity } from "lodash";
import React from "react";
import ClipLoader from "react-spinners/ClipLoader";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error: string | null;
  status: "success" | "warning" | "error" | null;
  label?: string;
  id: string;
  verifying?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, status, verifying, ...props }: InputProps, ref) => {
    return (
      <div className="w-full mb-4">
        {label && (
          <label className="block text-white/[0.6] text-md font-semibold mb-1" htmlFor={id}>
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`${
              status === "error" ? "border-red-400 focus:border-red-400" : "border-white/[0.3]"
            } shadow appearance-none border-2 focus:border-white/[0.8] border-box rounded-md w-full py-2 px-3 text-md bg-black/[0.3] text-sepia placeholder:text-gray-300 leading-tight focus:outline-none`}
            id={id}
            {...props}
          />
          {verifying && (
            <div className="absolute right-2 top-0 bottom-0 h-full w-fit flex flex-col justify-center">
              <ClipLoader className="" color="white" size={"1em"} />
            </div>
          )}
        </div>
        <div className="h-3">
          {error && !verifying && <p className="text-red-400 text-sm  text-left ml-1">{error}</p>}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;

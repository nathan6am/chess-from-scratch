import React from "react";
import ClipLoader from "react-spinners/ClipLoader";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error: string | null;
  status: "success" | "warning" | "error" | null;
  label?: string;
  id: string;
  disabled?: boolean;
  optional?: boolean;
  verifying?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, status, verifying, disabled, optional, ...props }: InputProps, ref) => {
    return (
      <div className="w-full mb-3">
        {label && (
          <span className="flex flex-row items-center mb-1">
            <label className="block text-white/[0.6] text-md font-semibold " htmlFor={id}>
              {label}
            </label>
            {optional && <p className="text-xs text-white/[0.3] font-medium ml-1 mt-[2px]">(optional)</p>}
          </span>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`${
              status === "error" ? "border-red-400 focus:border-red-400" : "border-white/[0.3]"
            } shadow appearance-none border-2 focus:border-white/[0.8] border-box rounded-md w-full py-2 px-3 text-md  ${
              disabled ? "text-white/[0.5] bg-white/[0.1]" : "text-sepia bg-black/[0.3]"
            } placeholder:text-gray-300 leading-tight focus:outline-none`}
            id={id}
            disabled={disabled}
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

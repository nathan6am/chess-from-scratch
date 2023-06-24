import React from "react";
import ClipLoader from "react-spinners/ClipLoader";
import classNames from "classnames";
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null | undefined;
  status?: "success" | "warning" | "error" | null;
  label?: string;
  id?: string;
  disabled?: boolean;
  optional?: boolean;
  verifying?: boolean;
  className?: string;
  showErrorMessages?: boolean;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      error,
      status,
      verifying,
      disabled,
      optional,
      className,
      containerClassName,
      showErrorMessages = true,
      ...props
    }: InputProps,
    ref
  ) => {
    return (
      <div className={classNames("w-full", containerClassName)}>
        {label && (
          <span className="flex flex-row items-center mb-0.5">
            <label className="block text-light-300 text-sm font-semibold " htmlFor={id}>
              {label}
            </label>
            {optional && <p className="text-xs text-white/[0.3] font-medium ml-1 mt-[2px]">(optional)</p>}
          </span>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={classNames(
              `shadow appearance-none border-2 focus:border-light-200 border-light-400 border-box rounded-md w-full py-1.5 px-3 text-md  
             leading-tight focus:outline-none text-gold-100 placeholder-light-400`,
              {
                "border-danger-400 focus:border-danger-400": status === "error" || error,
                "border-success-400 focus:border-success-400": status === "success",
                "bg-elevation-1 focus:bg-elevation-2": !disabled,
              },
              className
            )}
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
        {showErrorMessages && (
          <div className="h-3 mb-2">
            {error && !verifying && <p className="text-danger-400 text-xs  text-left ml-1">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;

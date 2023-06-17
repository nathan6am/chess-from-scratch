import { useState, useMemo } from "react";
import { Switch } from "@headlessui/react";
import classNames from "classnames";

interface Props {
  onChange: (enabled: boolean) => any;
  label?: string;
  checked?: boolean;
  defaultValue?: boolean;
  srLabel?: string;
  labelClasses?: string;
  className?: string;
  reverse?: boolean;
  disabled?: boolean;
}
export default function Toggle({
  label,
  checked,
  onChange,
  srLabel,
  labelClasses,
  className,
  reverse,
  disabled,
}: Props) {
  const controlled = useMemo(() => checked !== undefined, [checked]);
  const [enabled, setEnabled] = useState(false);
  const changeHandler = (value: boolean) => {
    onChange(value);
    if (!controlled) {
      setEnabled(value);
    }
  };
  return (
    <div
      className={`flex ${
        reverse ? "flex-row-reverse justify-end items-center" : "flex-row justify-between"
      }  ${className}`}
    >
      {label && (
        <label
          className={classNames(labelClasses, {
            "text-white/[0.7]": disabled,
          })}
        >
          {label}
        </label>
      )}
      <Switch
        disabled={disabled}
        checked={controlled ? checked : enabled}
        onChange={changeHandler}
        className={`${(controlled ? checked : enabled) && !disabled ? "bg-green-500" : "bg-white/[0.1]"}
        ${reverse ? "mr-3" : ""} relative inline-flex items-center h-[20px] w-[40px] shrink-0 ${
          disabled ? "" : "cursor-pointer"
        } rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75 `}
      >
        <span className="sr-only">{srLabel || "Use Setting"}</span>

        <span
          aria-hidden="true"
          className={classNames(
            "pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
            {
              "translate-x-[18px]": controlled ? checked : enabled,
              "opacity-20": disabled,
            }
          )}
        />
      </Switch>
    </div>
  );
}

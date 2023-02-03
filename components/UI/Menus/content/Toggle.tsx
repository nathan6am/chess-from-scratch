import { useState, useMemo } from "react";
import { Switch } from "@headlessui/react";
import e from "express";

interface Props {
  onChange: (enabled: boolean) => any;
  label?: string;
  checked?: boolean;
  defaultValue?: boolean;
  srLabel?: string;
  labelClasses?: string;
  className?: string;
}
export default function Toggle({
  label,
  checked,
  onChange,
  srLabel,
  labelClasses,
  className,
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
    <div className="flex flex-row my-6 justify-between">
      {label && <label className={labelClasses || ""}>{label}</label>}
      <Switch
        checked={controlled ? checked : enabled}
        onChange={changeHandler}
        className={`${
          (controlled ? checked : enabled) ? "bg-green-500" : "bg-white/[0.1]"
        }
          relative inline-flex items-center h-[20px] w-[40px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75 ${className}`}
      >
        <span className="sr-only">{srLabel || "Use Setting"}</span>
        <span
          aria-hidden="true"
          className={`${
            (controlled ? checked : enabled)
              ? "translate-x-[18px]"
              : "translate-x-[-6px]"
          }
            pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </div>
  );
}

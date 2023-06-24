import React, { useMemo, useState } from "react";
import classNames from "classnames";
import styles from "./RangeSlider.module.scss";
import { twMerge } from "tailwind-merge";
import s from "connect-redis";
interface Props {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  minLabel?: string;
  maxLabel?: string;
  minThumbClassName?: string;
  maxThumbClassName?: string;
  trackClassName?: string;
  className?: string;
  labelPosition?: "top" | "bottom";
  lock?: Set<"min" | "max">; // Locks the min or max thumb in place
  allowOverlap?: "atMin" | "atMax" | "atBounds" | "anywhere" | "none"; // Allows the min and max thumb to overlap
}

export default function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  minLabel,
  minThumbClassName,
  maxThumbClassName,
  maxLabel,
  lock,
  labelPosition = "bottom",
  allowOverlap = "none",
}: Props) {
  const [minValue, maxValue] = value;
  const minOffset = useMemo(() => {
    if (allowOverlap === "atMax" || allowOverlap === "atBounds") return maxValue === max ? 0 : step;
    if (allowOverlap === "anywhere") return 0;
    if (allowOverlap === "atMin") return step;
    return step;
  }, [allowOverlap, step, maxValue, max]);
  const maxOffset = useMemo(() => {
    if (allowOverlap === "atMin" || allowOverlap === "atBounds") return minValue === min ? 0 : step;
    if (allowOverlap === "anywhere") return 0;
    if (allowOverlap === "atMax") return step;
    return step;
  }, [allowOverlap, step, minValue, min]);
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const newMinVal = Math.min(+e.target.value, maxValue - minOffset);
    onChange([newMinVal, maxValue]);
  };
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const newMaxVal = Math.max(+e.target.value, minValue + maxOffset);
    onChange([minValue, newMaxVal]);
  };
  const minPos = useMemo(() => ((minValue - min) / (max - min)) * 100, [min, max, minValue]);
  const maxPos = useMemo(() => ((maxValue - min) / (max - min)) * 100, [min, max, maxValue]);
  return (
    <div className="w-full px-0 py-0">
      <div className={styles.wrapper}>
        <InputContainer>
          <Input
            min={min}
            max={max}
            step={step}
            value={minValue}
            onChange={handleMinChange}
            disabled={lock?.has("min")}
          />
          <Input
            min={min}
            max={max}
            step={step}
            value={maxValue}
            onChange={handleMaxChange}
            disabled={lock?.has("max") || minValue === maxValue}
          />
        </InputContainer>
        <Control
          labelPosition={labelPosition}
          minPos={minPos}
          maxPos={maxPos}
          minLabel={minLabel}
          maxLabel={maxLabel}
          minThumbClassName={minThumbClassName}
          maxThumbClassName={maxThumbClassName}
        />
      </div>
    </div>
  );
}
function InputContainer({ children, className }: { children: JSX.Element | JSX.Element[]; className?: string }) {
  return (
    <div
      className={` my-0 mx-[8px] absolute h-[16px]`}
      style={{
        marginLeft: `-8px`,
        width: `calc(100% + 16px)`,
      }}
    >
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  min: number;
  max: number;
  step: number;
  value: number;
  disabled?: boolean;
}
function Input({ disabled, ...props }: InputProps) {
  return (
    <input
      type="range"
      className={classNames({
        [styles.input]: !disabled,
        [styles.inputDisabled]: disabled,
      })}
      {...props}
      disabled={disabled}
    />
  );
}

interface ControlProps {
  minPos: number;
  maxPos: number;
  minLabel?: string;
  maxLabel?: string;
  innerTrackClassName?: string;
  outerTrackClassName?: string;
  minThumbClassName?: string;
  maxThumbClassName?: string;
  labelPosition: "top" | "bottom";
}
function Control({
  minPos,
  maxPos,
  minLabel,
  maxLabel,
  minThumbClassName,
  maxThumbClassName,
  outerTrackClassName,
  innerTrackClassName,
  labelPosition,
}: ControlProps) {
  return (
    <div className="w-full absolute h-[16px]">
      <Thumb position={minPos} label={minLabel} className={minThumbClassName} labelPosition={labelPosition} />
      <div
        className={twMerge(
          "w-full top-[50%] h-[6px] bg-light-400 rounded-full absolute -translate-y-1/2",
          outerTrackClassName
        )}
      >
        <div
          className={twMerge("h-full absolute bg-gold-100/[0.6]", innerTrackClassName)}
          style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
        />
      </div>
      <Thumb position={maxPos} label={maxLabel} className={maxThumbClassName} labelPosition={labelPosition} />
    </div>
  );
}

function Thumb({
  position,
  label,
  className,
  labelPosition,
}: {
  position: number;
  label?: string;
  className?: string;
  labelPosition: "top" | "bottom";
}) {
  return (
    <div
      className={twMerge("rounded-full bg-gold-200 h-[16px] w-[16px] absolute z-[2] ml-[-8px]", className)}
      style={{ transform: "translate3d(0%, 0%, 0)", left: `${position}%` }}
    >
      <span
        className={classNames("text-center -translate-x-1/2 ml-[8px] absolute text-xs text-light-200", {
          "-translate-y-[24px]": labelPosition === "top",
          "translate-y-[18px]": labelPosition === "bottom",
        })}
      >
        {label}
      </span>
    </div>
  );
}

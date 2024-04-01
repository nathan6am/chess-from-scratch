import React, { useState } from "react";
import { MdVolumeMute, MdVolumeUp } from "react-icons/md";
interface Props {
  value: number;
  onChange: (value: number) => void;
}
export default function VolumeSlider({ onChange, value }: Props) {
  return (
    <div className="flex flex-row items-center w-80">
      <input
        type="range"
        className="bg-gold-100 disabled w-full mr-2"
        max={100}
        min={0}
        value={value}
        onChange={(e) => {
          onChange(parseInt(e.target.value));
        }}
      />
      {value === 0 ? (
        <MdVolumeMute className="text-white text-2xl cursor-pointer" />
      ) : (
        <MdVolumeUp className="text-white text-2xl cursor-pointer" />
      )}
    </div>
  );
}

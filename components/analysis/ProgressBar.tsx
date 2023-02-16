import React from "react";

export default function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="bg-[#404040] h-2 w-full">
      <div
        className={`transition-all ease-in-out duration-1000 relative overflow-hidden h-full bg-green-500 ${
          progress < 100 ? "shimmer" : ""
        }`}
        style={{ width: `${progress < 10 ? 0 : progress}%` }}
      ></div>
    </div>
  );
}

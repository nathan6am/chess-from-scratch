import useThrottle from "@/hooks/useThrottle";
import React, { useEffect } from "react";

export default function ProgressBar({ progress: progressRaw }: { progress: number }) {
  const progress = useThrottle(progressRaw, 600);
  const ref = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!ref.current) return;
        ref.current.style.transform = `translate3d(${
          -100 + (progress < 100 ? progress : 100)
        }%, 0px, 0px)`;
      });
    });
  }, [progress, ref]);
  return (
    <div className="bg-[#404040] h-2 w-full overflow-hidden relative">
      <div
        ref={ref}
        className={`absolute top-0 bottom-0 left-0 right-0 h-full bg-green-500 ${
          progress < 100 ? "shimmer" : ""
        }`}
        style={{
          width: "100%",
          transition: "transform 0.6s ease",
          willChange: "transform",
          transform: "translate3d(-100%, 0px, 0px)",
        }}
      ></div>
    </div>
  );
}

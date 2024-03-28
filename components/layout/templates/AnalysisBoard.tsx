import { useState } from "react";
import * as Chess from "@/lib/chess";

import styles from "@/styles/BoardTemplate.module.scss";
import cn from "@/util/cn";
export default function BoardWithPanel() {
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  return (
    <div className="flex-1 flex-col md:flex-row bg-red-100 flex sm:items-center justify-between">
      <div className="flex flex-1 h-fit w-full flex-row grow items-stretch justify-center relative py-[2em]">
        <>
          <div className={cn("absolute top-0 bottom-0 flex flex-row justify-start mr-8", styles.boardWidth)}>
            <div
              className={cn("flex justify-between items-center shrink", {
                "flex-col": orientation === "w",
                "flex-col-reverse": orientation === "b",
              })}
            >
              <>
                <p className={cn(" p-1 px-4 bg-elevation-3 w-full")}>
                  {"player b name"}
                  <span className="inline opacity-50">{`(${null || "?"})`}</span>
                </p>
              </>
              <>
                <p className={cn(" p-1 px-4 bg-elevation-3 w-full")}>
                  {"player w name "}
                  <span className="inline opacity-50">{`(${null || "?"})`}</span>
                </p>
              </>
            </div>
            <div
              className={cn("flex justify-between items-center shrink", {
                "flex-col": orientation === "w",
                "flex-col-reverse": orientation === "b",
              })}
            >
              {/* <span>
                {analysis.timeRemaining.b !== null && <DisplayClock time={analysis.timeRemaining.b} color="b" />}
              </span>
              <span>
                {analysis.timeRemaining.w !== null && <DisplayClock time={analysis.timeRemaining.w} color="w" />}
              </span> */}
            </div>
          </div>
        </>
        <div className={`${styles.boardContainer} pl-2 pb-2`}>
          <div className={`${styles.board}`}></div>
        </div>
        <div className={` bg-orange-300 w-8 mb-2 `}></div>
      </div>
      <div className="h-full bg-blue-300 w-full md:w-[20em] lg:w-[28em]"></div>
    </div>
  );
}

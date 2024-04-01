import React, { useContext } from "react";
import { AnalysisContext } from "./AnalysisBoard";
import cn from "classnames";
import { Color } from "@/lib/chess";
//Icons
import { IoMdStopwatch } from "react-icons/io";

import { DetailsContainer } from "@/components/layout/templates/AnalysisBoardLayout";
import { Duration } from "luxon";

export default function PlayerDetails({ orientation }: { orientation: Color }) {
  const { analysis } = useContext(AnalysisContext);
  const { evalEnabled } = analysis;
  return (
    <>
      <DetailsContainer
        className={cn({
          "mr-[30px] md:mr-[40px] lg:mr-[50px]": evalEnabled,
        })}
      >
        <div
          className={cn("flex justify-between items-center shrink", {
            "flex-col": orientation === "w",
            "flex-col-reverse": orientation === "b",
          })}
        >
          <>
            {analysis.tagData.black && (
              <p className={cn(" p-1 px-4 bg-white/[0.1] w-full")}>
                {analysis.tagData.black}
                <span className="inline opacity-50">{`(${analysis.tagData.eloBlack || "?"})`}</span>
              </p>
            )}
          </>
          <>
            {analysis.tagData.white && (
              <p className={cn(" p-1 px-4 bg-white/[0.1] w-full")}>
                {analysis.tagData.white}
                <span className="inline opacity-50">{`(${analysis.tagData.eloWhite || "?"})`}</span>
              </p>
            )}
          </>
        </div>
        <div
          className={cn("flex justify-between items-center shrink", {
            "flex-col": orientation === "w",
            "flex-col-reverse": orientation === "b",
          })}
        >
          <span>
            {analysis.timeRemaining.b !== null && (
              <DisplayClock time={analysis.timeRemaining.b} color="b" />
            )}
          </span>
          <span>
            {analysis.timeRemaining.w !== null && (
              <DisplayClock time={analysis.timeRemaining.w} color="w" />
            )}
          </span>
        </div>
        {/* <>
  <div className="absolute top-[-2em] bottom-[-2em] flex flex-row justify-center w-inherit">
    <div
      className={classNames("flex justify-between items-center shrink", {
        "flex-col": orientation === "w",
        "flex-col-reverse": orientation === "b",
      })}
    >
      <>
        {analysis.tagData.black && (
          <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
            {analysis.tagData.black}{" "}
            <span className="inline opacity-50">{`(${analysis.tagData.eloBlack || "?"})`}</span>
          </p>
        )}
      </>
      <>
        {analysis.tagData.white && (
          <p className={classNames(" p-1 px-4 bg-white/[0.1] w-full")}>
            {analysis.tagData.white}{" "}
            <span className="inline opacity-50">{`(${analysis.tagData.eloWhite || "?"})`}</span>
          </p>
        )}
      </>
    </div>
    <div
      className={classNames("flex justify-between items-center shrink", {
        "flex-col": orientation === "w",
        "flex-col-reverse": orientation === "b",
      })}
    >
      <span>
        {analysis.timeRemaining.b !== null && <DisplayClock time={analysis.timeRemaining.b} color="b" />}
      </span>
      <span>
        {analysis.timeRemaining.w !== null && <DisplayClock time={analysis.timeRemaining.w} color="w" />}
      </span>
    </div>
  </div>
</> */}
      </DetailsContainer>
    </>
  );
}

function DisplayClock({ time, color }: { time: number; color: Color }) {
  const duration = Duration.fromMillis(time);

  return (
    <div
      className={cn("p-1 px-4 flex flex-row items-center justify-center", {
        "bg-[#919191] text-black/[0.7]": color === "w",
        "bg-black text-white": color === "b",
      })}
    >
      <IoMdStopwatch className="mr-2" />
      {duration.toFormat("hh:mm:ss")}
    </div>
  );
}

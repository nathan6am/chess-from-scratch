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
          <div
            className={cn(
              "absolute top-0 bottom-0 flex flex-row justify-start mr-8",
              styles.boardWidth
            )}
          ></div>
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

export function BoardWithPanelContainer({ children }: { children: JSX.Element | JSX.Element[] }) {
  return (
    <div className="flex-1 flex-col md:flex-row flex sm:items-center justify-between relative pt-10">
      {children}
    </div>
  );
}

export function BoardRow({ children }: { children: JSX.Element | JSX.Element[] }) {
  return (
    <div className="flex flex-1 h-fit w-full flex-row grow items-stretch justify-center relative py-[2em] ">
      {children}
    </div>
  );
}

export function BoardContainer({ children }: { children: JSX.Element | JSX.Element[] }) {
  return <div className={`${styles.boardContainer}`}>{children}</div>;
}

export function PanelContainer({ children }: { children: JSX.Element | JSX.Element[] }) {
  return (
    <div className="h-full bg-elevation-2 w-full md:w-[26em] lg:w-[32em] flex-col flex max-w-[100vw] overflow-hidden ">
      {children}
    </div>
  );
}

export function DetailsContainer({
  children,
  className,
}: {
  children: JSX.Element | JSX.Element[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 flex flex-row justify-start",
        styles.boardWidth,
        className
      )}
    >
      {children}
    </div>
  );
}

import { useState } from "react";
import * as Chess from "@/lib/chess";

import styles from "@/styles/BoardTemplate.module.scss";
import cn from "@/util/cn";
export default function GameLayout() {
  const [orientation, setOrientation] = useState<Chess.Color>("w");
  return (
    <div className="flex-1 flex-col md:flex-row bg-red-100 flex sm:items-center justify-between sm:py-[2em]">
      <div className="flex flex-1 h-fit w-full flex-col grow items-center justify-start sm:justify-center relative ">
        <div className={cn(`${styles.boardWidth}`, "flex flex-row justify-between bg-green-500")}>
          <p>PLAYER CARD</p>
        </div>
        <div className={`${styles.boardContainer}`}>
          <div className={`${styles.board} bg-red-300`}></div>
        </div>
        <div className={cn(`${styles.boardWidth}`, "flex flex-row justify-between bg-green-500")}>
          <p>PLAYER CARD</p>
        </div>
        <div className={` bg-orange-300 w-8 mb-2 `}></div>
      </div>
      <div className="h-full bg-blue-300 w-full md:w-[20em] lg:w-[28em]"></div>
    </div>
  );
}

export function GameContainer({
  children,
  className,
}: {
  children: JSX.Element | JSX.Element[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 flex-col md:flex-row flex sm:items-center justify-between relative",
        className
      )}
    >
      {children}
    </div>
  );
}

export function InfoRow({
  children,
  className,
}: {
  children: JSX.Element | JSX.Element[];
  className?: string;
}) {
  return (
    <div className={cn(`${styles.boardWidth}`, "flex flex-row justify-between", className)}>
      {children}
    </div>
  );
}
export function BoardColumn({
  children,
  className,
}: {
  children: JSX.Element | JSX.Element[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 h-fit w-full flex-col grow items-center justify-start sm:justify-center relative",
        className
      )}
    >
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

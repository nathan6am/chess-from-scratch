import React from "react";
import styles from "@/styles/Board.module.scss";

export interface LayoutComponentProps {
  children?: JSX.Element | JSX.Element[];
  className?: string;
}
export function BoardColumn({ children, className }: LayoutComponentProps) {
  return (
    <div
      className={`flex flex-col h-full  lg:basis-[100vh] grow shrink-1 justify-start items-center lg:justify-center ${className}`}
    >
      <div className={`w-full ${styles.boardColumn}`}>{children}</div>
    </div>
  );
}

export function BoardRow({ children }: LayoutComponentProps) {
  return (
    <div className="flex flex-row h-full w-full items-center justify-center lg:py-6 lg:pb-10 lg:pt-4">{children}</div>
  );
}

export function PanelColumn({ children }: LayoutComponentProps) {
  return (
    <div className="h-full hidden lg:block max-h-[1060px]">
      <div className="h-full w-[320px] xl:w-[400px] flex flex-col justify-center mx-4 py-20">
        <div className="h-full max-h-[60vw] w-full  flex flex-col">{children}</div>
      </div>
    </div>
  );
}

export function PanelColumnLg({ children }: LayoutComponentProps) {
  return (
    <div className="h-full hidden lg:block max-h-[1200px]">
      <div className="h-full w-[460px] xl:w-[500px] flex flex-col justify-center mx-4 py-6">
        <div className="h-full  w-full  flex flex-col">{children}</div>
      </div>
    </div>
  );
}
export function PanelContainer({ children }: LayoutComponentProps) {
  return <div className="bg-[#121212] flex flex-col h-full">{children}</div>;
}

export function ScrollContainer({ children }: LayoutComponentProps) {
  return (
    <div className="top-0 bottom-0 left-0 right-0 overflow-y-scroll absolute scrollbar scrollbar-thumb-white/[0.2] scrollbar-rounded-sm scrollbar-thin scrollbar-track-[#161616] scrollbar-w-[8px]">
      {children}
    </div>
  );
}

import React from "react";
import styles from "@/styles/Board.module.scss";

interface LayoutComponentProps {
  children?: JSX.Element | JSX.Element[];
  className?: string;
}
export function BoardColumn({ children }: LayoutComponentProps) {
  return (
    <div className="flex flex-col h-full grow justify-start lg:justify-center items-center">
      <div className={`w-full ${styles.boardColumn}`}>{children}</div>
    </div>
  );
}

export function BoardRow({ children }: LayoutComponentProps) {
  return (
    <div className="flex flex-row h-full w-full items-center justify-center py-6 lg:py-10">
      {children}
    </div>
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

export function PanelContainer({ children }: LayoutComponentProps) {
  return <div className="bg-[#121212] flex flex-col h-full">{children}</div>;
}

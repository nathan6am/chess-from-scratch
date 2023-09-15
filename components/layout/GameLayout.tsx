import React from "react";
import styles from "@/styles/Board.module.scss";
import { twMerge } from "tailwind-merge";

export interface LayoutComponentProps {
  children?: JSX.Element | JSX.Element[];
  className?: string;
  auto?: boolean;
}
export function BoardColumn({ children, className }: LayoutComponentProps) {
  return (
    <div
      className={`flex flex-col h-full lg:basis-[100vh] grow shrink-1 justify-start items-center lg:justify-center ${className}`}
    >
      <div className={`w-full ${styles.boardColumn}`}>{children}</div>
    </div>
  );
}

export function BoardRow({ children }: LayoutComponentProps) {
  return (
    <div className="flex flex-col md:flex-row h-full w-full items-start pt-[5rem] md:items-center justify-center md:py-6 lg:pb-10 lg:pt-4">
      {children}
    </div>
  );
}

export function PanelColumn({ children, className }: LayoutComponentProps) {
  return (
    <div className={twMerge("h-full hidden lg:block max-h-[1060px]", className)}>
      <div className="h-full w-[400px] xl:w-[420px] flex flex-col justify-center mx-4 py-20">
        <div className="h-full max-h-[60vw] w-full  flex flex-col">{children}</div>
      </div>
    </div>
  );
}

export function PanelColumnSm({ children, className }: LayoutComponentProps) {
  return (
    <div
      className={twMerge(
        "h-full w-full max-w-[36rem] md:max-w-[50vw] mx-auto lg:mx-0 lg:w-fit max-h-[1400px] bg-elevation-1 md:mt-0",
        className
      )}
    >
      <div className="h-full w-full md:min-w-[26rem]  lg:w-[30rem] xl:w-[36rem] flex flex-col justify-center ">
        <div className="h-full min-h-[700px] w-full  flex flex-col">{children}</div>
      </div>
    </div>
  );
}
export function PanelColumnLg({ children, className }: LayoutComponentProps) {
  return (
    <div
      className={twMerge(
        "h-full w-full max-w-[36rem] md:max-w-[50vw] mx-auto lg:mx-0 lg:w-fit max-h-[1400px] bg-elevation-1 md:mt-0",
        className
      )}
    >
      <div className="h-full w-full md:min-w-[26rem]  lg:w-[30rem] xl:w-[36rem] flex flex-col justify-center ">
        <div className="h-full min-h-[700px] w-full  flex flex-col">{children}</div>
      </div>
    </div>
  );
}
export function PanelContainer({ children }: LayoutComponentProps) {
  return <div className="bg-[#121212] flex flex-col h-full">{children}</div>;
}

export const ScrollContainer = React.forwardRef<HTMLDivElement, LayoutComponentProps>(
  ({ children, auto, className }, ref) => {
    return (
      <div
        ref={ref}
        className={`top-0 bottom-0 left-0 right-0 ${
          auto ? "overflow-y-auto" : "overflow-y-scroll"
        } absolute scrollbar scrollbar-thumb-elevation-4 scrollbar-rounded-sm scrollbar-thin scrollbar-track-elevation-0 scrollbar-w-[8px] ${className}`}
      >
        {children}
      </div>
    );
  }
);

ScrollContainer.displayName = "ScrollContainer";

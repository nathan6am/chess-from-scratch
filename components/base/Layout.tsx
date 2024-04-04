import React from "react";
import cn from "@/util/cn";
export interface LayoutComponentProps {
  children?: JSX.Element | JSX.Element[];
  className?: string;
}

interface ScrollContainerProps extends LayoutComponentProps {
  /** If enabled, the scroll bar will only appear if the content overflows */
  auto?: boolean;
}

/**
 * Vertical scroll container with custom scrollbar
 *
 */
export const ScrollContainer = React.forwardRef<HTMLDivElement, ScrollContainerProps>(
  ({ children, auto, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute top-0 bottom-0 left-0 right-0",
          {
            "overflow-y-auto": auto,
            "overflow-y-scroll": !auto,
          },
          "scrollbar scrollbar-thumb-elevation-4 scrollbar-rounded-sm scrollbar-thin scrollbar-track-elevation-0 scrollbar-w-[8px]",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

ScrollContainer.displayName = "ScrollContainer";

export const Row = ({ children, className }: LayoutComponentProps) => {
  return <div className={cn("flex flex-row, items-center", className)}>{children}</div>;
};

export const CenteredCol = ({ children, className }: LayoutComponentProps) => {
  return <div className={cn("flex flex-1 justify-center", className)}>{children}</div>;
};

export const PageContainer = ({ children, className }: LayoutComponentProps) => {
  return (
    <CenteredCol>
      <div className="max-w-[1536px] w-full flex-1 py-2 sm:px-4 lg:px-6 flex flex-col">{children}</div>
    </CenteredCol>
  );
};

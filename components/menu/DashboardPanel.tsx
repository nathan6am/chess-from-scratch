import React from "react";
import cn from "@/util/cn";

interface Props {
  children?: React.ReactNode;
  width?: "sm" | "md" | "fit" | "grow";
  height?: "sm" | "md" | "fit" | "grow";
  className?: string;
}
export default function DashboardPanel({ children, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col w-full h-full items-center p-0 bg-elevation-2 shadow-lg rounded-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

import React from "react";
import cn from "@/util/cn";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.FC<any>;
  label?: string;
  badge?: string;
  className?: string;
  iconSize?: string;
  iconClassName?: string;
}

export default function IconButton({
  icon: Icon,
  label,
  badge,
  className,
  iconClassName,
  iconSize,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-center rounded-md p-2 hover:bg-elevation-4 hover:text-gold-200 hover:shadow transition-colors duration-200 text-light-300",
        className
      )}
      {...props}
    >
      <Icon className={iconClassName} size={iconSize || "1.4em"} />
    </button>
  );
}

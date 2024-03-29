import cn from "@/util/cn";

interface Props {
  children?: JSX.Element | JSX.Element[];
  className?: string;
  size: "sm" | "md" | "lg";
  height: "fit-content" | "full";
}

export default function Panel({ children, className, size = "sm", height }: Props) {
  return (
    <div
      className={cn(
        "w-full bg-elevation-2 shadow-md rounded-sm",
        {
          "col-span-12 lg:col-span-6 xl:col-span-4": size === "sm",
          "col-span-12 lg:col-span-6 xl:col-span-8": size === "md",
          "col-span-12": size === "lg",
          "h-full": height === "full",
          "h-fit": height === "fit-content",
        },
        className
      )}
    >
      {children}
    </div>
  );
}

import cn from "@/util/cn";

interface Props {
  children?: JSX.Element | JSX.Element[];
  className?: string;
}
export default function DashboardGrid({ children, className }: Props) {
  return <div className={cn("w-full flex-1 grid grid-cols-12 gap-6", className)}>{children}</div>;
}

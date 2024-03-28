//utils
import cn from "@/util/cn";

interface Props {
  children?: JSX.Element | JSX.Element[];
  toggle: () => void;
  collapse: boolean;
}

export default function ControlPanel({ children, toggle, collapse }: Props) {
  return (
    <div
      className={cn(
        "h-screen w-[240px] h-full flex flex-col fixed justify-between overflow-y-auto",
        "border-r border-elevation-4 bg-elevation-2",
        "trasition ease-in-out duration-500",
        {
          "translate-x-[-240px] sm:translate-x-[-180px]": collapse,
          "translate-x-0": !collapse,
        }
      )}
    ></div>
  );
}

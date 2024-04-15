import { ClipLoader } from "react-spinners";
import cn from "@/util/cn";

interface Props {
  className?: string;
  label?: string;
}
export default function Loading({ className }: Props) {
  return (
    <div className={cn("py-10 w-full flex justify-center items-center", className)}>
      <ClipLoader color="#DCB96A" size={20} />
    </div>
  );
}

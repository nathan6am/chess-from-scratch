import Knight from "@/public/assets/knight.svg";
import cn from "@/util/cn";
interface Props {
  size?: "sm" | "md" | "lg";
}
const Logo = ({ size = "sm" }: Props) => (
  <div className="flex flex-row items-end">
    <h1
      className={cn("text-xl font-extrabold text-white flex flex-row items-end", {
        "text-2xl": size === "md",
        "text-3xl": size === "lg",
      })}
    >
      <Knight
        className={cn("fill-gold-200 inline h-8 w-8", {
          "h-12 w-12": size === "md",
          "h-16 w-16": size === "lg",
        })}
      />
      NextChess
    </h1>
  </div>
);

export default Logo;

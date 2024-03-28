import Knight from "@/public/assets/knight.svg";
const Logo = () => (
  <div className="flex flex-row items-end">
    <h1 className="text-xl font-extrabold text-white flex flex-row items-end">
      <Knight className="fill-gold-200 inline h-8 w-8" />
      NextChess
    </h1>
  </div>
);

export default Logo;

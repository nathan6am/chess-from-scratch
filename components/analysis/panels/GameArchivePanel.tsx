import GameSearch from "@/components/menu/GameSearch";
import { RiArrowGoBackFill } from "react-icons/ri";

interface Props {
  onBack?: () => void;
}
export default function GameArchivePanel({ onBack }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-white/[0.1] p-4 flex flex-row shadow-lg relative">
        <div className="absolute left-0 top-0 bottom-0 flex flex-row items-center gap-x-2 px-4">
          <button
            className="flex flex-row items-center mr-4 text-white/[0.8] hover:text-white text-xl"
            onClick={onBack}
          >
            <RiArrowGoBackFill className="mr-2" />
          </button>
        </div>
        <h2 className="text-lg font-semibold text-white text-center w-full">Game Archive</h2>
      </div>
      <GameSearch />
      <button>
        <span>Open</span>
      </button>
    </div>
  );
}

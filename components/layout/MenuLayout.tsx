import React from "react";
import SideBar from "./SideBar";
import TopBar from "./TopBar";
const PAGES = [
  { href: "/play", label: "Play", key: "play" },
  { href: "/puzzles", label: "Puzzles", key: "puzzles" },
  { href: "/study", label: "Study", key: "study" },
  { href: "/options", label: "Options", key: "options" },
  { href: "/profile", label: "Profile", key: "profile" },
];
interface Props {
  children?: JSX.Element | JSX.Element[];
}
export default function MenuLayout({ children }: Props) {
  return (
    <div className="min-h-screen sm:min-h-[90%] w-full flex flex-col backdrop-blur-lg bg-[#121212] sm:rounded-lg overflow-hidden shadow-lg">
      <TopBar />
      <div className="flex flex-col lg:grid lg:grid-cols-5 w-full grow bg-[#181818]">
        <div className="flex flex-col h-fit lg:py-20 rounded-l-md col-span-5 lg:col-span-1 lg:h-full w-full items-end justify-start  bg-[#1f1f1f]">
          <SideBar pages={PAGES} />
        </div>
        <div className="h-full w-full grow lg:col-span-4">{children}</div>
      </div>
    </div>
  );
}

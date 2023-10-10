import React, { useEffect, useContext } from "react";
import { UserContext } from "@/context/user";
import SideBar from "./SideBar";
import TopBar from "./TopBar";
import useProfile from "@/hooks/useProfile";
import { useRouter } from "next/router";
import { ScrollContainer } from "./GameLayout";
import Background from "./Background";
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
    <Background>
      <div className="min-h-screen sm:min-h-[90%] w-full flex flex-col backdrop-blur-lg bg-elevation-0 sm:rounded-lg overflow-hidden shadow-lg">
        <TopBar />
        <div className="flex flex-col lg:grid lg:grid-cols-5 w-full grow bg-elevation-1">
          <div className="flex flex-col h-fit lg:py-20 rounded-l-md col-span-5 lg:col-span-1 lg:h-full w-full items-end justify-start  bg-elevation-2">
            <SideBar pages={PAGES} />
          </div>
          <div className="h-full w-full grow lg:col-span-4 relative">
            <ScrollContainer>{children}</ScrollContainer>
          </div>
        </div>
      </div>
    </Background>
  );
}

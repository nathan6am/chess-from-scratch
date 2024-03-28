import React from "react";
import SideMenu from "./SideMenu";

import { useMediaQuery } from "@react-hook/media-query";
import { useState, useEffect } from "react";
import cn from "@/util/cn";
import { GiHamburgerMenu } from "react-icons/gi";
import IconButton from "../base/IconButton";
import NonSSRWrapper from "../NonSSRWrapper";
interface Props {
  children?: JSX.Element | JSX.Element[];
}

export default function Dashboard({ children }: Props) {
  const isMobile = useMediaQuery("only screen and (max-width: 640px)");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  // Auto collapse Sidebar on route change on mobile devices
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  return (
    <>
      <div
        className={`text-white z-[90] fixed top-0 left-0 right-0 px-2 flex flex-row items-center bg-elevation-2 sm:hidden h-12 flex flex-row `}
      >
        <IconButton
          className={`${sidebarCollapsed ? "sm:hidden" : "hidden"}`}
          icon={GiHamburgerMenu}
          onClick={toggleSidebar}
        />
      </div>
      <SideMenu
        collapse={sidebarCollapsed}
        toggle={toggleSidebar}
        pages={[
          { label: "Play", key: "play", href: "/play" },
          { label: "Puzzles", key: "puzzles", href: "/puzzles" },
          { label: "Study", key: "study", href: "/study" },
          { label: "Profile", key: "profile", href: "/profile" },
          { label: "Options", key: "options", href: "/options" },
        ]}
      />
      <div
        className={cn("w-full bg-elevation-1 trasition ease-in-out duration-500 min-h-screen flex max-w-screen", {
          "pl-0 sm:pl-[60px]": sidebarCollapsed,
          "sm:pl-[60px] lg:pl-[240px]": !sidebarCollapsed,
        })}
      >
        <NonSSRWrapper>
          <main className="flex-1 pt-12 sm:pt-0 flex">{children}</main>
        </NonSSRWrapper>
      </div>
    </>
  );
}

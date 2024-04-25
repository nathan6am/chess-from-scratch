import { Tooltip } from "react-tooltip";

import { UserContext } from "@/context/user";
import { SettingsContext } from "@/context/settings";
import useSyncSettings from "@/hooks/useSyncSettings";
import React from "react";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";

import useAuth from "@/hooks/queries/useAuth";
import { Inter, Open_Sans } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const open_sans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, refetch } = useAuth();
  const { settings, updateSettings } = useSyncSettings();
  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      <UserContext.Provider value={{ user, refresh: refetch }}>
        <Tooltip
          id="my-tooltip"
          style={{
            backgroundColor: "#161616",
            color: "#dddddd",
            opacity: "96%",
            padding: "0.25em 0.5em",
            zIndex: 300,
            backdropFilter: "blur(10px)",
            borderRadius: "0.25em",
            maxWidth: "30em",
          }}
        ></Tooltip>
        {children}
      </UserContext.Provider>
    </SettingsContext.Provider>
  );
}

import { Tooltip } from "react-tooltip";
import { SocketContext, socket } from "@/context/socket";
import { UserContext } from "@/context/user";
import { AppSettings, defaultSettings, SettingsContext } from "@/context/settings";

import React from "react";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import { useLocalStorage } from "usehooks-ts";
import useAuth from "@/hooks/useAuth";
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
  const [settings, setSettings] = useLocalStorage("app-settings", defaultSettings);
  const updateSettings = (settings: Partial<AppSettings>) => {
    setSettings((currentSettings) => ({ ...currentSettings, ...settings }));
  };
  const { user, refetch } = useAuth();

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      <UserContext.Provider value={{ user, refresh: refetch }}>
        <SocketContext.Provider value={socket}>
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
        </SocketContext.Provider>
      </UserContext.Provider>
    </SettingsContext.Provider>
  );
}

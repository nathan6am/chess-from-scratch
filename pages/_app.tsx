import "../styles/globals.css";
import "../styles/previews.css";
import "react-tooltip/dist/react-tooltip.css";
import "react-contexify/dist/ReactContexify.css";
import { Tooltip } from "react-tooltip";
import type { AppProps } from "next/app";
import { SocketContext, socket } from "../context/socket";
import { UserContext } from "@/context/user";
import { AppSettings, defaultSettings, SettingsContext } from "@/context/settings";
import useUser from "@/hooks/useUser";
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import { useLocalStorage } from "usehooks-ts";
import useProfile from "@/hooks/useProfile";
const queryClient = new QueryClient();
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);
  const [settings, setSettings] = useLocalStorage("app-settings", defaultSettings);
  const updateSettings = (settings: Partial<AppSettings>) => {
    setSettings((currentSettings) => ({ ...currentSettings, ...settings }));
  };
  const { user, error, isValidating, mutate } = useUser();
  const router = useRouter();
  const prevUserRef = useRef(user?.id || null);
  useEffect(() => {
    if (!user && !isValidating) {
      router.push("/login");
      prevUserRef.current = null;
    } else if (user && user.type === "incomplete") {
      router.push("/complete-profile");
    }
    if (user && user.id !== prevUserRef.current) {
    }
  }, [user]);
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsContext.Provider value={{ settings, updateSettings }}>
        <UserContext.Provider value={{ user, refresh: mutate }}>
          <SocketContext.Provider value={socket}>
            <Tooltip
              id="my-tooltip"
              style={{
                backgroundColor: "#464646",
                color: "#fff",
                opacity: "100%",
                zIndex: 300,
                maxWidth: "30em",
              }}
            ></Tooltip>
            {getLayout(<Component {...pageProps} />)}
          </SocketContext.Provider>
        </UserContext.Provider>
      </SettingsContext.Provider>
    </QueryClientProvider>
  );
}

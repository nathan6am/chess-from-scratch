import "../styles/globals.css";
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
  const { mutate: refreshProfile } = useProfile();
  const prevUserRef = useRef(user?.id || null)
  useEffect(() => {
    if (!user && !isValidating) {
      router.push("/login");
      prevUserRef.current = null
      refreshProfile()
    } else if (user && user.type === "incomplete") {
      router.push("/complete-profile");
    }
    if (user && user.id !== prevUserRef.current ) {
      refreshProfile();
    }
    
  }, [user]);
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsContext.Provider value={{ settings, updateSettings }}>
        <UserContext.Provider value={{ user, refresh: mutate }}>
          <SocketContext.Provider value={socket}>{getLayout(<Component {...pageProps} />)}</SocketContext.Provider>
        </UserContext.Provider>
      </SettingsContext.Provider>
    </QueryClientProvider>
  );
}

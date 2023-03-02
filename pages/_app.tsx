import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SocketContext, socket } from "../context/socket";
import { UserContext } from "@/context/user";
import { AppSettings, defaultSettings, SettingsContext } from "@/context/settings";
import useUser from "@/hooks/useUser";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import { useLocalStorage } from "usehooks-ts";
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
  useEffect(() => {
    if (!user && !isValidating) {
      router.push("/login");
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

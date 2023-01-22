import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SocketContext, socket } from "../context/socket";
import { UserContext } from "@/context/user";
import { defaultSettings, SettingsContext } from "@/context/settings";
import useUser from "@/hooks/useUser";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import router from "@/server/routes/auth";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);
  const [settings, updateSettings] = useState(() => defaultSettings);
  const { user, error, isValidating, mutate } = useUser();
  const router = useRouter();
  useEffect(() => {
    if (!user && !isValidating) {
      router.push("/login");
    }
  }, [user]);
  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      <UserContext.Provider value={{ user, refresh: mutate }}>
        <SocketContext.Provider value={socket}>
          {getLayout(<Component {...pageProps} />)}
        </SocketContext.Provider>
      </UserContext.Provider>
    </SettingsContext.Provider>
  );
}

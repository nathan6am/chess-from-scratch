import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SocketContext, socket } from "../context/socket";
import { UserContext } from "@/context/user";
import { defaultSettings, SettingsContext } from "@/context/settings";
import useUser from "@/hooks/useUser";

import React, { useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [settings, updateSettings] = useState(() => defaultSettings);
  const { user, error } = useUser();
  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      <UserContext.Provider value={user}>
        <SocketContext.Provider value={socket}>
          <Component {...pageProps} />
        </SocketContext.Provider>
      </UserContext.Provider>
    </SettingsContext.Provider>
  );
}

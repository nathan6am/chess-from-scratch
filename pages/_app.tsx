import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SocketContext, socket } from "../context/socket";
import { UserContext } from "@/context/user";
import useUser from "@/hooks/useUser";

import React from "react";

export default function App({ Component, pageProps }: AppProps) {
  //const { user, error } = useUser();
  return (
    <UserContext.Provider value={undefined}>
      {/* <SocketContext.Provider value={socket}> */}
      <Component {...pageProps} />
      {/* </SocketContext.Provider> */}
    </UserContext.Provider>
  );
}

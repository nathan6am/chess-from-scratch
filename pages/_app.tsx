import "../styles/globals.css";
import "../styles/previews.css";
import "react-tooltip/dist/react-tooltip.css";
import "react-contexify/dist/ReactContexify.css";
import "react-range-slider-input/dist/style.css";
import { Tooltip } from "react-tooltip";
import type { AppProps } from "next/app";
import { SocketContext, socket } from "../context/socket";
import { UserContext } from "@/context/user";
import { AppSettings, defaultSettings, SettingsContext } from "@/context/settings";
import Layout from "@/components/layout/Layout";
import { useRouter } from "next/router";
import React, { useEffect, useState, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import { useLocalStorage } from "usehooks-ts";
import useProfile from "@/hooks/useProfile";
import useAuth from "@/hooks/useAuth";
import { Open_Sans } from "next/font/google";

// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
// });

// const noto_sans = Noto_Sans({
//   subsets: ["latin"],
//   weight: "400",
//   variable: "--font-noto-sans",
// });

const open_sans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});
const queryClient = new QueryClient();
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <main className={`${open_sans.variable} font-sans`}>{getLayout(<Component {...pageProps} />)}</main>
      </Layout>
    </QueryClientProvider>
  );
}

import React, { ReactElement } from "react";
import Head from "next/head";
import { NextPageWithLayout } from "@/pages/_app";
import { NextPage, NextPageContext } from "next";
import Dashboard from "@/components/layout/Dashboard";
import GameOnline from "@/components/GameOnline";
import NonSSRWrapper from "@/components/NonSSRWrapper";
interface Props {
  lobbyid: string;
}

const Lobby: NextPageWithLayout<Props> = ({ lobbyid }) => {
  return (
    <>
      <Head>
        <title>Next-Chess | Play Chess</title>
        <meta name="description" content="Play Chess with Next-Chess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <GameOnline lobbyid={lobbyid} />
    </>
  );
};

Lobby.getLayout = function getLayout(page: ReactElement) {
  return <Dashboard className="bg-elevation-0">{page}</Dashboard>;
};
interface Context extends NextPageContext {
  query: {
    lobbyid: string;
  };
}
Lobby.getInitialProps = async (ctx: Context) => {
  const { lobbyid } = ctx.query;
  return { lobbyid: lobbyid as string };
};

export default Lobby;

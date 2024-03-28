import React from "react";

import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { authRedirect } from "@/util/auth-middleware";
import { PlayContent } from "@/components/UI/Menus/content/";
import Dashboard from "@/components/layout/Dashboard";
const Play: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Next-Chess | Play Chess</title>
        <meta name="description" content="Play Chess with Next-Chess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <PlayContent />
    </>
  );
};

Play.getLayout = function getLayout(page: ReactElement) {
  return <Dashboard>{page}</Dashboard>;
};

export const getServerSideProps = authRedirect;

export default Play;

import React from "react";

import Head from "next/head";
import { NextPageContext } from "next";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import ZenMode from "@/components/puzzle/ZenMode";
import Dashboard from "@/components/layout/Dashboard";
const Play: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Next-Chess | Puzzles</title>
        <meta name="description" content="Solve Puzzles With Next-Chess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ZenMode />
    </>
  );
};

Play.getLayout = function getLayout(page: ReactElement) {
  return <Dashboard className="bg-elevation-0">{page}</Dashboard>;
};

export async function getServerSideProps(context: NextPageContext) {
  const req = context.req;
  const res = context.res;
  if (!res) return { props: {} };
  if (!req?.user) {
    res.setHeader("location", "/login");
    res.statusCode = 302;
    res.end();
    return { props: {} };
  }
  return { props: { user: req?.user } };
}

export default Play;

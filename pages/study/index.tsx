import React from "react";
import Head from "next/head";
import { NextPageContext } from "next";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import StudyMenu from "@/components/menu/study/StudyMenu";
import Dashboard from "@/components/layout/Dashboard";
const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Next-Chess | Study</title>
        <meta name="description" content="Study Chess with Next-Chess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <StudyMenu />
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Dashboard>{page}</Dashboard>;
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
  console.log(req?.user);
  return { props: { user: req?.user } };
}

export default Page;

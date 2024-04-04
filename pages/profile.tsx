import React from "react";

import Head from "next/head";
import { NextPageContext } from "next";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import Dashboard from "@/components/layout/Dashboard";
import Profile from "@/components/menu/profile/Profile";
const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Next-Chess | My Profile</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Profile />
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
  if (req.user.type === "guest") {
    res.setHeader("location", "/login");
    res.statusCode = 302;
    res.end();
    return { props: {} };
  }
  if (req.user.type === "incomplete") {
    res.setHeader("location", "/complete-profile");
    res.statusCode = 302;
    res.end();
    return { props: {} };
  }
  return { props: { user: req?.user } };
}

export default Page;

import React from "react";
import { NextPage, NextPageContext } from "next";

import NonSSRWrapper from "@/components/NonSSRWrapper";

import Head from "next/head";
import BoardEditor from "@/components/analysis/BoardEditor";
const Page: NextPage = () => {
  return (
    <>
      <Head>
        <title>Board Editor | Next-Chess</title>
        <meta name="description" content="Edit Chess Board" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="h-screen w-screen justify-center items-center flex bg-elevation-0">
        <main className="flex justify-center items-center w-full h-full">
          <div className="md:h-full w-full w-full flex justify-center items-center  ">
            <NonSSRWrapper>
              <BoardEditor />
            </NonSSRWrapper>
          </div>
        </main>
      </div>
    </>
  );
};

export default Page;

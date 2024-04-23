//Framework
import React, { useState, useContext, useCallback } from "react";
import Head from "next/head";
import { Logo } from "@/components/base";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "../_app";
import axios from "axios";
//Layouts
import AuthLayout from "@/components/layout/AuthLayout";

//Icons
import { NextPageContext } from "next";
import Link from "next/link";

interface PageProps {
  verified: boolean;
}
const Page: NextPageWithLayout<PageProps> = ({ verified }) => {
  return (
    <>
      <Head>
        <title>NextChess | Email Verification</title>
        <meta name="Log In" content="Sign In to Continue to NextChess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-full h-full">
        <div className="flex flex-col items-center justify-center h-full w-full">
          <h1 className="text-3xl font-semibold text-gold-200 my-4">Email Verification</h1>

          {verified ? (
            <></>
          ) : (
            <p>
              {`Email Verification Failed! This link is invalid or may have expired. Please `}
              <Link href="/login">login</Link>
              {` to request a new verification email.`}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const token = ctx.query.token;
  console.log(token);
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify-email?token=${token}`);
    const verified = res && res.status === 200;
    return { props: { verified } };
  } catch (e) {
    return { props: { verified: false } };
  }
};

export default Page;

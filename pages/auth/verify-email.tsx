//Framework
import React, { useState, useContext, useCallback } from "react";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "../_app";
import axios from "axios";
//Layouts
import AuthLayout from "@/components/layout/AuthLayout";

//Icons
import { NextPageContext } from "next";

interface PageProps {
  verified: boolean;
}
const Page: NextPageWithLayout<PageProps> = ({ verified }) => {
  const onResend = () => {
    axios
      .post("/api/auth/resend-verification-email")
      .then((res) => {})
      .catch((err) => {});
  };
  return (
    <>
      <Head>
        <title>NextChess | Sign In</title>
        <meta name="Log In" content="Sign In to Continue to NextChess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-full h-full">
        <div className="flex flex-col items-center justify-center h-full w-full">
          <h1 className="text-3xl font-semibold text-light-100">Email Verification</h1>
          <p className="text-light-200 text-center">
            {verified ? "Email Verified! You can now sign in." : "Email Verification Failed!"}
          </p>
          <button onClick={onResend}>Resend verification email</button>
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

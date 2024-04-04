//Framework
import User from "@/lib/db/entities/User";
import React, { useState, useContext, useEffect } from "react";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "./_app";
import { NextPageContext } from "next";
import useAuth from "@/hooks/useAuth";
import AuthLayout, { Background } from "@/components/layout/AuthLayout";
//UI Components

//Icons
import CompleteProfileForm from "@/components/forms/CompleteProfileForm";
import { SessionUser } from "@/lib/db/entities/User";
interface Props {
  profile?: User;
}
const SignUp: NextPageWithLayout = () => {
  useEffect(() => {
    refetch();
  }, []);
  const { user, profile, isLoading, authStatus, refetch } = useAuth();
  if (!profile) return <></>;
  return (
    <div className=" min-h-[85%] max-w-screen lg:max-w-[900px] w-full backdrop-blur-lg bg-gradient-to-r from-[#1f1f1f]/[0.5] to-[#181818]/[0.5] flex flex-col justify-center items-center overflow-hidden sm:rounded-lg shadow-lg ">
      <>
        <Head>
          <title>NextChess | Account Setup</title>
          <meta name="Account Setup" content="Sign In to Continue to NextChess" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="w-full h-full flex flex-col justify-center items-center">
          <CompleteProfileForm profile={profile} />
        </div>
      </>
    </div>
  );
};

SignUp.getLayout = function getLayout(page: ReactElement) {
  return <Background>{page}</Background>;
};

export async function getServerSideProps(context: NextPageContext) {
  const req = context.req;
  const res = context.res;
  if (!res) return { props: {} };
  if (!req) return { props: {} };

  //Redirect to login if no user
  if (!req?.user) {
    res.setHeader("location", "/login");
    res.statusCode = 302;
    res.end();
    return { props: {} };
  }

  //Redirect to play if guest or account is already setup
  const user = req.user as SessionUser;
  if (user.type === "guest" || user.type === "user") {
    res.setHeader("location", "/play");
    res.statusCode = 302;
    res.end();
    return { props: {} };
  } else if (req.user) {
    return { props: {} };
  }
}
export default SignUp;

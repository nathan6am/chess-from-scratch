//Framework
import { User } from "@/lib/db/entities/user";
import React, { useState, useContext } from "react";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "./_app";
import { NextPageContext } from "next";

//Layouts
import RootLayout from "@/components/layout/RootLayout";
import AuthLayout from "@/components/layout/AuthLayout";

//UI Components
import LoginForm from "@/components/UI/forms/LoginForm";

//Icons
import { FaGithub } from "react-icons/fa";
import Knight from "../public/assets/knight.svg";
import CompleteProfileForm from "@/components/UI/forms/CompleteProfileForm";
import { SessionUser } from "@/lib/db/entities/user";
import axios from "axios";
import { initialize } from "@/lib/db/connect";
interface Props {
  profile?: User;
}
import userofile from "@/hooks/useProfile";
const SignUp: NextPageWithLayout = () => {
  const { user, error } = userofile();
  if (!user) return <></>;
  return (
    <div className=" min-h-[85%] max-w-screen lg:max-w-[900px] w-full backdrop-blur-lg bg-gradient-to-r from-[#1f1f1f]/[0.5] to-[#181818]/[0.5] flex flex-col justify-center items-center overflow-hidden sm:rounded-lg shadow-lg ">
      <>
        <Head>
          <title>NextChess | Account Setup</title>
          <meta name="Account Setup" content="Sign In to Continue to NextChess" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="w-full h-full flex flex-col justify-center items-center">
          <CompleteProfileForm profile={user} />
        </div>
      </>
    </div>
  );
};

SignUp.getLayout = function getLayout(page: ReactElement) {
  return <RootLayout>{page}</RootLayout>;
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

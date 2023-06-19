//Framework
import React, { useState, useContext } from "react";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "./_app";

//Layouts
import RootLayout from "@/components/layout/RootLayout";
import AuthLayout from "@/components/layout/AuthLayout";

//UI Components
import LoginForm from "@/components/UI/forms/LoginForm";

//Icons
import { FaGithub } from "react-icons/fa";
import Knight from "../public/assets/knight.svg";
import SignUpForm from "@/components/forms/SignUpForm";
const SignUp: NextPageWithLayout = () => {
  return (
    <div className=" min-h-[85%] max-w-screen lg:max-w-[900px] w-full backdrop-blur-lg bg-gradient-to-r from-[#1f1f1f]/[0.5] to-[#181818]/[0.5] flex flex-col justify-center items-center overflow-hidden sm:rounded-lg shadow-lg ">
      <>
        <Head>
          <title>NextChess | Sign In</title>
          <meta name="Log In" content="Sign In to Continue to NextChess" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="w-full h-full flex flex-col justify-center items-center">
          <SignUpForm />
        </div>
      </>
    </div>
  );
};

SignUp.getLayout = function getLayout(page: ReactElement) {
  return <RootLayout>{page}</RootLayout>;
};

export default SignUp;

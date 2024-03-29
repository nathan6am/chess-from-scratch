//Framework
import React, { useState, useContext } from "react";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "./_app";

//Layouts
import AuthLayout from "@/components/layout/AuthLayout";

//Icons
import { FaGithub } from "react-icons/fa";
import Knight from "../public/assets/knight.svg";
import SignInForm from "@/components/forms/SignInForm";

const Login: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>NextChess | Sign In</title>
        <meta name="Log In" content="Sign In to Continue to NextChess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-full h-full grid grid-cols-5">
        <LandingContent />
        <div className="w-full max-w-screen col-span-5 lg:hidden mt-6 ">
          <div className="border-t border-white/[0.5] w-[80%] mx-auto" />
        </div>
        <SignInForm />
      </div>
    </>
  );
};

Login.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

function LandingContent() {
  return (
    <div className="flex flex-col py-10 md:py-20 rounded-l-md col-span-5 lg:col-span-3 h-full w-full justify-center items-start px-10 lg:items-end lg:px-20 ">
      <div className="flex text-xs md:text-sm lg: text-md flex-col md:flex-row items-end lg:flex-col lg:mb-6 mb-4">
        <h1 className="text-5xl lg:text-6xl mt-4 font-extrabold text-light-100 flex flex-row items-end">
          <Knight className="fill-gold-200 inline h-16 w-16 lg:h-24 lg:w-24 mr-3 opac" />
          NextChess
        </h1>
        <p className="text-light-400 text-right opacity-80 ml-3 lg:ml-0 ">v 0.1.0</p>
      </div>
      <h3 className="text-gold-100 text-md lg:text-lg my-4 md:my-6 lg:text-right lg:max-w-[500px]">
        A fully featured online Chess GUI made with React, Next.js and TypeScript.
      </h3>
      <a
        className="text-white lg:text-lg opacity-50 flex flex-row items-center hover:underline hover:opacity-75 lg:my-6 my-4"
        target="_blank"
        rel="noreferrer"
        href="https://github.com/nathan6am/chess-from-scratch"
      >
        View the source code
        <FaGithub className="inline ml-2 my-auto" />
      </a>
    </div>
  );
}

export default Login;

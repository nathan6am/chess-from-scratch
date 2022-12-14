import React from "react";
import ButtonSocial from "@/components/UI/ButtonSocial";
import { FaGithub } from "react-icons/fa";
import Head from "next/head";
import Image from "next/image";
import Knight from "../public/assets/knight.svg";
import { useRouter } from "next/router";
import router from "server/routes/auth";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div
      style={{
        backgroundImage: `url("/assets/background.png")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        overflowX: "hidden",
        backgroundPosition: "bottom 0 left 0",
      }}
      className="flex w-screen md:h-screen justify-center items-center "
    >
      <div className="h-full w-full justify-center items-center flex ">
        <Head>
          <title>Next-Chess</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="flex container justify-center items-center w-full h-full">
          <div className="md:h-[90%] max-w-[140vh] w-full flex justify-center items-center backdrop-blur-lg bg-gradient-to-r from-[#1f1f1f]/[0.5] to-[#181818]/[0.5] rounded-lg grid grid-cols-5 shadow-lg">
            <div className="flex flex-col py-20 rounded-l-md col-span-5 lg:col-span-3 h-full w-full justify-center items-end px-20 ">
              <h1 className="text-7xl my-4 font-extrabold text-white flex flex-row items-end">
                <Knight className="fill-[#CDA882] inline h-24 w-24 mr-3 opac" />
                NextChess
              </h1>
              <p className="text-white text-right opacity-25 mb-6">v 0.1.0</p>
              <h3 className="text-sepia text-lg my-6 text-right w-[500px]">
                A fully featured online Chess GUI made with React, Next.js and TypeScript.
              </h3>
              <a
                className="text-white text-lg opacity-50 flex flex-row items-center hover:underline hover:opacity-75 my-6"
                target="_blank"
                rel="noreferrer"
                href="https://github.com/nathan6am/chess-from-scratch"
              >
                View the source code
                <FaGithub className="inline ml-2 my-auto" />
              </a>
            </div>
            <div className="w-full col-span-5 lg:hidden mt-6 ">
              <div className="border-t border-white/[0.5] w-[80%] mx-auto" />
            </div>
            <div className="flex flex-col  max-w-[500px] items-center justify-center px-6 lg:px-10 xl:px-10 col-span-5 lg:col-span-2 h-[80%] lg:border-l border-white/[0.5] w-full my-4 mx-auto">
              <h2 className="text-2xl text-white my-12 py-2 border-b-4 border-sepia/[0.7] px-2">Sign In to Continue</h2>
              <ButtonSocial variant="google" href="/auth/google" />

              <ButtonSocial variant="facebook" href="/auth/facebook" />

              <p className="my-6 text-white opacity-50">or</p>
              <button
                onClick={() => {
                  router.push("/");
                }}
                className="text-white bg-neutral-600 hover:bg-neutral-700 text-lg py-4 my-6 rounded-md w-full"
              >
                Continue as Guest
              </button>
              <p className="text-white/[0.25] text-center px-10 my-6">
                By continuing or signing in, you agree to our{" "}
                <a className="hover:text-white/[0.5] underline">Terms and Conditions</a> and{" "}
                <a className="hover:text-white/[0.5]  underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

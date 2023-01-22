import React, { useState, useContext } from "react";
import ButtonSocial from "@/components/UI/ButtonSocial";
import { FaGithub } from "react-icons/fa";
import Head from "next/head";
import Image from "next/image";
import Knight from "../public/assets/knight.svg";
import Link from "next/link";
import { useRouter } from "next/router";
import Input from "@/components/UI/Input";
import axios from "axios";
import { UserContext } from "@/context/user";
import SignUpForm from "@/components/UI/forms/SignUpForm";
export default function LoginPage() {
  return (
    <div
      style={{
        backgroundImage: `url("/assets/background.png")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        overflowX: "hidden",
        backgroundPosition: "bottom 0 left 0",
      }}
      className="flex w-screen lg:h-screen justify-center items-center "
    >
      <div className="h-full w-full justify-center items-center flex ">
        <Head>
          <title>NextChess | Sign In</title>
          <meta name="Log In" content="Sign In to Continue to NextChess" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="flex container justify-center items-center w-full h-full">
          <div className="lg:h-[90%] max-w-[140vh] w-full flex justify-center items-center backdrop-blur-lg bg-gradient-to-r from-[#1f1f1f]/[0.5] to-[#181818]/[0.5] rounded-lg grid grid-cols-5 shadow-lg">
            <SignUpForm />
            <div className="w-full col-span-5 lg:hidden mt-6 ">
              <div className="border-t border-white/[0.5] w-[80%] mx-auto" />
            </div>
            <div className="flex flex-col"></div>
          </div>
        </main>
      </div>
    </div>
  );
}

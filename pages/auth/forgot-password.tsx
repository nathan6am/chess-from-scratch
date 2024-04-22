//Framework
import React, { useState, useContext, useCallback } from "react";
import Head from "next/head";
import { Logo } from "@/components/base";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "../_app";
import { Input, Button } from "@/components/base";
import Link from "next/link";
import axios from "axios";
//Layouts
import AuthLayout from "@/components/layout/AuthLayout";

interface PageProps {
  verified: boolean;
}
const Page: NextPageWithLayout<PageProps> = ({ verified }) => {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const onSubmit = useCallback(async (email: string) => {
    if (!email) return;
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      alert("An error occurred. Please try again later.");
    }
  }, []);
  return (
    <>
      <Head>
        <title>NextChess | Forgot Password</title>
        <meta name="description" content="Forgot Password" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-full h-full">
        <div className="flex flex-col items-center justify-center h-full w-full">
          <Logo size="lg" />
          <h1 className="text-3xl font-semibold text-gold-200 my-4 mb-8">Forgot Your Password?</h1>

          {submitted ? (
            <>
              <p className="text-light-200 mb-4 max-w-xl text-center">
                {`If your email address exists in our system, you will receive an email with a link to reset your password. Don't see the email? Try checking your spam folder.`}
              </p>
              <p className="text-light-400 text-sm mb-4">
                <em>Note: For security reasons, this link wil expire in 24 hours.</em>
              </p>
              <Link href="/login">Return to Login Page</Link>
            </>
          ) : (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmit(email);
                }}
                className="w-full justify-center items-center flex flex-col"
              >
                <p className="text-light-200 text-center mb-4">
                  {`No Problem. Enter your email address below and we'll send you a link to reset your password.`}
                </p>
                <Input
                  placeholder="Email"
                  containerClassName="max-w-sm"
                  label="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                />
                <Button type="submit" label="Reset your Password"></Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Page;

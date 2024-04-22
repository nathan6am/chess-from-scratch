//Framework
import React, { useState, useContext, useCallback } from "react";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "./_app";
import { MdEmail } from "react-icons/md";
import axios from "axios";
//Layouts
import AuthLayout from "@/components/layout/AuthLayout";

//Icons
import { NextPageContext } from "next";
import { PanelHeader, Body } from "@/components/base/Typography";
import { Button, Logo } from "@/components/base";
const Page: NextPageWithLayout = () => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isResent, setIsResent] = useState(false);
  const [sentTo, setSentTo] = useState("test@test.com");
  const onSend = () => {
    setIsSending(true);
    axios
      .post("/api/auth/send-verification-email")
      .then((res) => {
        if (isSent) {
          setIsResent(true);
        }
        setIsSent(true);
        setIsSending(false);
        setSentTo(res.data.email);
      })
      .catch((err) => {});
  };
  return (
    <>
      <Head>
        <title>NextChess | Verify your email</title>
        <meta name="Log In" content="Sign In to Continue to NextChess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-full h-full">
        <div className="flex flex-col items-center justify-center h-full w-full">
          <Logo size="lg" />
          <PanelHeader className="text-3xl my-4">
            <MdEmail className="inline mr-2" />
            Verify your email address
          </PanelHeader>
          <h1 className=" font-semibold text-light-100 text-xl mb-4">{`You're almost there!`}</h1>
          {!isSent && (
            <Body className="text-light-200 my-4">
              Please verify your email address to complete your account setup.
            </Body>
          )}
          {isSent && sentTo && (
            <div className="flex flex-col  items-center">
              <Body className="text-light-200 text-center">
                We sent a verification link to {`${sentTo} Just click the link in the email to complete your signup.`}
              </Body>

              <Body className="text-light-200 max-w-md text-center my-4">
                {`Don't see a link? Try checking your spam folder. If you still don't see it, you can click the button below to resend the email.`}
              </Body>
              <br />
            </div>
          )}
          <Button
            onClick={onSend}
            disabled={isSending}
            label={isSent ? "Resend verification email" : "Send verification email"}
            isLoading={isSending}
            loadingLabel="Sending"
          ></Button>
          {isSent && (
            <Body className="text-sm text-light-400 my-4">
              <em>For security reasons, this link will expire in 24 hours.</em>
            </Body>
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

//Framework
import React from "react";
import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "./_app";

//Layouts
import AuthLayout from "@/components/layout/AuthLayout";

//Icons
import { ScrollContainer } from "@/components/layout/GameLayout";

import Privacy from "@/components/content/Privacy";

const Login: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>NextChess | Privacy Policy</title>
        <meta name="Log In" content="Sign In to Continue to NextChess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="w-full h-full relative grow">
        <ScrollContainer>
          <Privacy />
        </ScrollContainer>
      </div>
    </>
  );
};

Login.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Login;

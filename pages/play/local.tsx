import React from "react";

import Head from "next/head";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { GetServerSideProps } from "next";
import { removeUndefinedFields } from "@/util/misc";
import LocalGame from "@/components/game/LocalGame";
import Dashboard from "@/components/layout/Dashboard";
import type { TimeControl } from "@/lib/chess";

interface Props {
  fromPosition?: string;
  autoFlip?: boolean;
  invertOpposingPieces?: boolean;
  timeControl?: TimeControl;
}
const Page: NextPageWithLayout = ({ fromPosition, autoFlip, invertOpposingPieces, timeControl }: Props) => {
  return (
    <>
      <Head>
        <title>Next-Chess | Play Chess</title>
        <meta name="description" content="Play Chess with Next-Chess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LocalGame
        fromPosition={fromPosition}
        autoFlip={autoFlip}
        invertOpposingPieces={invertOpposingPieces}
        timeControl={timeControl}
      />
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Dashboard>{page}</Dashboard>;
};

function parseTimeControl(timeControl: string): TimeControl {
  const [time, increment] = timeControl.split("+");
  return {
    timeSeconds: parseInt(time) * 60,
    incrementSeconds: parseInt(increment),
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const req = context.req;
  const fromPosition = context.query.fromPosition
    ? decodeURIComponent(context.query.fromPosition as string)
    : undefined;

  const autoFlip = context.query.autoFlip === "true" ? true : false;
  const invertOpposingPieces = context.query.invertOpposingPieces === "true" ? true : false;
  console.log(invertOpposingPieces);
  const timeControl = context.query.timeControl ? parseTimeControl(context.query.timeControl as string) : undefined;
  return {
    props: removeUndefinedFields({
      fromPosition,
      invertOpposingPieces,
      autoFlip,
      timeControl,
    }),
  };
};

export default Page;

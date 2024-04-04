import React from "react";
import Head from "next/head";
import { NextPage, NextPageContext } from "next";
import type { GetServerSideProps } from "next";
import { NextPageWithLayout } from "../_app";
import EngineGame from "@/components/game/EngineGame";
import { SkillPreset } from "@/hooks/useEngineGame";
import { TimeControl } from "@/lib/chess";
import { removeUndefinedFields } from "@/util/misc";
import Dashboard from "@/components/layout/Dashboard";
interface Props {
  skillLevel: SkillPreset;
  fromPosition?: string;
  playerColor: "w" | "b";
  timeControl?: TimeControl;
}
const Page: NextPageWithLayout<Props> = ({ skillLevel, fromPosition, playerColor, timeControl }: Props) => {
  return (
    <>
      <Head>
        <title>Next-Chess | Play Chess</title>
        <meta name="description" content="Play Chess with Next-Chess" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <EngineGame
        preset={skillLevel}
        startPosition={fromPosition}
        playerColor={playerColor}
        timeControl={timeControl}
      />
    </>
  );
};

function parseTimeControl(timeControl: string): TimeControl {
  const [time, increment] = timeControl.split("+");
  return {
    timeSeconds: parseInt(time) * 60,
    incrementSeconds: parseInt(increment),
  };
}

Page.getLayout = function getLayout(page) {
  return <Dashboard>{page}</Dashboard>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const req = context.req;
  const skillLevel = context.query.skillLevel ? parseInt(context.query.skillLevel as string) : 10;
  const fromPosition = context.query.fromPosition
    ? decodeURIComponent(context.query.fromPosition as string)
    : undefined;
  const playerColor = context.query.color === "b" ? "b" : "w";
  const timeControl = context.query.timeControl ? parseTimeControl(context.query.timeControl as string) : undefined;
  return {
    props: removeUndefinedFields({
      skillLevel,
      fromPosition,
      playerColor,
      timeControl,
    }),
  };
};
export default Page;

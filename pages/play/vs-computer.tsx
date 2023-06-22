import React from "react";
import { NextPage, NextPageContext } from "next";
import type { GetServerSideProps } from "next";
import GameLocal from "@/components/GameLocal";
import NonSSRWrapper from "@/components/NonSSRWrapper";
import EngineGame from "@/components/game/EngineGame";
import AnalysisBoard from "@/components/analysis/AnalysisBoard";
import { SkillPreset } from "@/hooks/useEngineGame";
import { TimeControl } from "@/lib/chess";
import { removeUndefinedFields } from "@/util/misc";
interface Props {
  skillLevel: SkillPreset;
  fromPosition?: string;
  playerColor: "w" | "b";
  timeControl?: TimeControl;
}
const Page: NextPage<Props> = ({ skillLevel, fromPosition, playerColor, timeControl }: Props) => {
  return (
    <div className="h-screen w-screen justify-center items-center flex bg-elevation-0">
      <main className="flex justify-center items-center w-full h-full">
        <div className="md:h-full w-full w-full flex justify-center items-center  ">
          <NonSSRWrapper>
            <EngineGame
              preset={skillLevel}
              startPosition={fromPosition}
              playerColor={playerColor}
              timeControl={timeControl}
            />
          </NonSSRWrapper>
        </div>
      </main>
    </div>
  );
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

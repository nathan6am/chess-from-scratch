import React from "react";
import { NextPage, NextPageContext } from "next";
import type { GetServerSideProps } from "next";

import NonSSRWrapper from "@/components/NonSSRWrapper";
import AnalysisBoard from "@/components/analysis/AnalysisBoard";

interface Props {
  id: string | null;
  game: string | null;
  sourceType: "masters" | "lichess" | null;
}
const Analyze: NextPage<Props> = ({ id, game, sourceType }: Props) => {
  return (
    <div className=" min-h-screen lg:h-screen  w-full  justify-center items-center flex bg-elevation-0">
      <main className="flex justify-center items-center w-full h-full">
        <div className="h-full w-full w-full flex justify-center items-center  ">
          <NonSSRWrapper>
            <AnalysisBoard initialId={id} sourceGameId={game} sourceGameType={sourceType} />
          </NonSSRWrapper>
        </div>
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const req = context.req;
  const id = context.query.id;
  const game = context.query.gameId;
  const sourceType = context.query.sourceType;
  return {
    props: {
      id: typeof id === "string" ? id : null,
      game: typeof game === "string" ? game : null,
      sourceType:
        sourceType === "masters" || sourceType === "lichess" || sourceType === "nextchess" ? sourceType : null,
    },
  };
};
export default Analyze;

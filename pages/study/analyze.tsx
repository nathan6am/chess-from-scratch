import React from "react";
import { NextPage, NextPageContext } from "next";
import type { GetServerSideProps } from "next";
import GameLocal from "@/components/GameLocal";
import NonSSRWrapper from "@/components/NonSSRWrapper";
import AnalysisBoard from "@/components/analysis/AnalysisBoard";

interface Props {
  id: string | null;
  game: string | null;
}
const Analyze: NextPage<Props> = ({ id, game }: Props) => {
  return (
    <div className="h-screen w-screen justify-center items-center flex bg-[#181818]">
      <main className="flex justify-center items-center w-full h-full">
        <div className="md:h-full w-full w-full flex justify-center items-center  ">
          <NonSSRWrapper>
            <AnalysisBoard initialId={id} sourceGameId={game} />
          </NonSSRWrapper>
        </div>
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const req = context.req;
  const id = context.query.id;
  const game = context.query.game;
  return { props: { id: typeof id === "string" ? id : null, game: typeof game === "string" ? game : null } };
};
export default Analyze;

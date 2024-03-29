import React from "react";
import { NextPage, NextPageContext } from "next";
import type { NextPageWithLayout } from "@/pages/_app";
import type { GetServerSideProps } from "next";
import Dashboard from "@/components/layout/Dashboard";
import NonSSRWrapper from "@/components/NonSSRWrapper";
import AnalysisBoard from "@/components/analysis/AnalysisBoard";

interface Props {
  id: string | null;
  game: string | null;
  sourceType: "masters" | "lichess" | null;
}
const Page: NextPageWithLayout<Props> = ({ id, game, sourceType }: Props) => {
  return <AnalysisBoard initialId={id} sourceGameId={game} sourceGameType={sourceType} />;
};
Page.getLayout = function getLayout(page) {
  return <Dashboard>{page}</Dashboard>;
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
export default Page;

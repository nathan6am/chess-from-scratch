import React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import type { GetServerSideProps } from "next";
import Dashboard from "@/components/layout/Dashboard";
import AnalysisBoard from "@/components/analysis/AnalysisBoard";
import Head from "next/head";
interface Props {
  id: string | null;
  game: string | null;
  sourceType: "masters" | "lichess" | null;
}
const Page: NextPageWithLayout<Props> = ({ id, game, sourceType }: Props) => {
  return (
    <>
      <Head>
        <title>Next-Chess | Analysis Board</title>
        <meta name="description" content="Analysis Board and PGN Editor" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AnalysisBoard initialId={id} sourceGameId={game} sourceGameType={sourceType} />
    </>
  );
};
Page.getLayout = function getLayout(page) {
  return <Dashboard className="bg-elevation-0">{page}</Dashboard>;
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
        sourceType === "masters" ||
        sourceType === "lichess" ||
        sourceType === "nextchess" ||
        sourceType === "last" ||
        sourceType === "puzzle"
          ? sourceType
          : null,
    },
  };
};
export default Page;

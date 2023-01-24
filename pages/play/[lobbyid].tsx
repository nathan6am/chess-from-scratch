import React from "react";
import { NextPage, NextPageContext } from "next";
import GameOnline from "@/components/GameOnline";
import NonSSRWrapper from "@/components/NonSSRWrapper";
interface Props {
  lobbyid: string;
}

const Lobby: NextPage<Props> = ({ lobbyid }) => {
  return (
    <div className="h-screen w-screen justify-center items-center flex bg-[#181818]">
      <main className="flex justify-center items-center px-8 xl:container w-screen h-full">
        <div className="md:h-full w-full flex justify-center items-center  ">
          <NonSSRWrapper>
            <GameOnline lobbyid={lobbyid} />
          </NonSSRWrapper>
        </div>
      </main>
    </div>
  );
};

interface Context extends NextPageContext {
  query: {
    lobbyid: string;
  };
}
Lobby.getInitialProps = async (ctx: Context) => {
  const { lobbyid } = ctx.query;
  return { lobbyid: lobbyid as string };
};

export default Lobby;

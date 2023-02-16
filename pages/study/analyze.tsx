import React from "react";
import { NextPage, NextPageContext } from "next";
import GameLocal from "@/components/GameLocal";
import NonSSRWrapper from "@/components/NonSSRWrapper";
import AnalysisBoard from "@/components/analysis/AnalysisBoard";

const Lobby: NextPage = () => {
  return (
    <div className="h-screen w-screen justify-center items-center flex bg-[#181818]">
      <main className="flex xl:container justify-center items-center w-full h-full">
        <div className="md:h-full w-full w-full flex justify-center items-center  ">
          <NonSSRWrapper>
            <AnalysisBoard />
          </NonSSRWrapper>
        </div>
      </main>
    </div>
  );
};

export default Lobby;

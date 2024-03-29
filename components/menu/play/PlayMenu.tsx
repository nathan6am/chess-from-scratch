import React from "react";
import RecentGames from "@/components/menu/play/RecentGames";
import { CenteredCol } from "../../base/Layout";
import NewGame from "./NewGame";
import { PageTitle } from "@/components/base/Typography";
export default function PlayMenu() {
  return (
    <CenteredCol>
      <div className="container flex flex-col">
        <div className="w-full ">
          <PageTitle>Play Chess</PageTitle>
        </div>

        <div className="w-full flex-1 grid grid-cols-12 gap-4">
          <div className="w-full col-span-12 md:col-span-6 lg:col-span-4 h-fit shrink-0 mb-4">
            <NewGame />
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-8 w-full h-full">
            <RecentGames />
          </div>
        </div>
      </div>
    </CenteredCol>
  );
}

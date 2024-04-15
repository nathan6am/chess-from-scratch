import React from "react";
import RecentGames from "@/components/menu/play/RecentGames";
import { PageContainer } from "../../base/Layout";
import NewGame from "./NewGame";
import { PageTitle } from "@/components/base/Typography";
import { DashboardGrid, Panel } from "@/components/dashboard";
export default function PlayMenu() {
  return (
    <PageContainer>
      <PageTitle>Play Chess</PageTitle>
      <DashboardGrid>
        <Panel size="sm" height="fit-content">
          <NewGame />
        </Panel>
        <Panel size="md" height="full">
          <RecentGames />
        </Panel>
      </DashboardGrid>
    </PageContainer>
  );
}

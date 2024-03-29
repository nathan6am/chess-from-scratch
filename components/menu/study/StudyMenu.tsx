import React from "react";
import { PageContainer } from "@/components/base/Layout";
import { PageTitle, PanelHeader } from "@/components/base/Typography";
import { DashboardGrid, Panel } from "@/components/dashboard";
import SavedAnalyses from "./SavedAnalyses";
import Tools from "./Tools";
export default function StudyMenu() {
  return (
    <PageContainer>
      <PageTitle>Study Chess</PageTitle>
      <DashboardGrid className="pb-8">
        <Panel size="sm" height="fit-content">
          <Tools />
        </Panel>
        <Panel size="md" height="full">
          <SavedAnalyses />
        </Panel>
      </DashboardGrid>
    </PageContainer>
  );
}

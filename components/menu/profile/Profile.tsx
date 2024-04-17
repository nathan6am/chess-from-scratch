import React from "react";
import { PageContainer } from "../../base/Layout";
import { PageTitle, PanelHeader } from "@/components/base/Typography";
import { DashboardGrid, Panel } from "@/components/dashboard";
import { Tab } from "@headlessui/react";
import cn from "@/util/cn";
import GameSearch from "../GameSearch";
import EditProfilePanel from "./EditProfilePanel";
export default function Profile() {
  return (
    <PageContainer>
      <PageTitle>My Profile</PageTitle>
      <DashboardGrid className="pb-4">
        <Panel size="sm" height="fit-content">
          <EditProfilePanel />
        </Panel>
        <Panel size="md" height="full" className="min-h-60vh overflow-hidden">
          <Tab.Group>
            <div className="w-full flex flex-row items-center justify-start bg-elevation-3">
              <StyledTab>My Games</StyledTab>
              <StyledTab>Stats</StyledTab>
              <StyledTab>Insights</StyledTab>
            </div>
            <Tab.Panel className="w-full grow flex flex-col flex-1 h-full">
              <GameSearch />
            </Tab.Panel>
            <Tab.Panel className="w-full grow flex flex-col">Stats coming soon</Tab.Panel>
            <Tab.Panel className="w-full grow flex flex-col">Insights coming soon</Tab.Panel>
          </Tab.Group>
        </Panel>
      </DashboardGrid>
    </PageContainer>
  );
}

function StyledTab({ children }: { children: string | JSX.Element | (string | JSX.Element)[] }) {
  return (
    <Tab
      className={({ selected }) =>
        cn(
          "flex-1 border-b border-b-4 py-2 text-md max-w-[10em] px-4",
          "focus:outline-none ",
          selected
            ? "bg-elevation-3 border-gold-200 text-light-100"
            : "bg-elevation-3 border-elevation-3 text-light-300 hover:bg-elevation-4 hover:border-gold-200 hover:text-light-100"
        )
      }
    >
      {children}
    </Tab>
  );
}

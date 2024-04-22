import { PageContainer } from "@/components/base/Layout";
import { DashboardGrid, Panel } from "@/components/dashboard";
import { Label, PageTitle } from "@/components/base/Typography";

import React, { Fragment, useState, useContext } from "react";
import { RadioGroup, Tab } from "@headlessui/react";
import { SettingsContext } from "@/context/settings";
import { Toggle, RadioButton, RangeSlider } from "@/components/base";

import ChangePasswordForm from "@/components/forms/ChangePasswordForm";
import AccountPanel from "./panels/AccountPanel";
import { ScrollContainer } from "@/components/layout/GameLayout";
import DisplayPanel from "./panels/DisplayPanel";
import GameBehaviorPanel from "./panels/GameBehaviorPanel";
import SoundPanel from "./panels/SoundPanel";
import ThemePanel from "./panels/ThemePanel";
import { useMemo } from "react";
import Select from "@/components/base/Select";
import { useMediaQuery } from "@react-hook/media-query";
export default function Options() {
  return (
    <PageContainer>
      <PageTitle>Options</PageTitle>
      <OptionsMenu />
    </PageContainer>
  );
}

export function PreferencesTabs() {
  const isMobile = useMediaQuery("only screen and (max-width: 640px)");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const tabList = [
    // { label: "Profile", value: 0 },
    { label: "Display", value: 1 },
    { label: "Theme", value: 2 },
    { label: "Game Behavior", value: 3 },
    { label: "Sound", value: 4 },
  ];

  return (
    <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex} vertical>
      {isMobile && (
        <>
          <Select
            className="mb-4 mx-4"
            options={tabList}
            value={selectedIndex}
            onChange={(value) => {
              setSelectedIndex(value);
            }}
          />
          <Tab.List className="hidden flex-col">
            {/* <MenuTab>Profile</MenuTab> */}
            <MenuTab>Display</MenuTab>
            <MenuTab>Board/Piece Theme</MenuTab>
            <MenuTab>Game Behavior</MenuTab>
            <MenuTab>Sound</MenuTab>
            {/* <MenuTab>Puzzles</MenuTab>
            <MenuTab>Change Password</MenuTab> */}
          </Tab.List>
        </>
      )}

      <DashboardGrid>
        <>
          {!isMobile && (
            <Panel
              size="sm"
              height="fit-content"
              className="col-span-3 sm:col-span-6 bg-elevation-3 lg:col-span-3 xl:col-span-3 h-0 sm:h-fit"
            >
              <Tab.List className="hidden sm:flex flex-col">
                {/* <MenuTab>Profile</MenuTab> */}
                <MenuTab>Display</MenuTab>
                <MenuTab>Board & Piece Theme</MenuTab>
                <MenuTab>Game Behavior</MenuTab>
                <MenuTab>Sound</MenuTab>
                {/* <MenuTab>Puzzles</MenuTab>
                <MenuTab>Change Password</MenuTab> */}
              </Tab.List>
            </Panel>
          )}
        </>
        <div className="relative col-span-12 sm:col-span-6 lg:col-span-9 xl:col-span-9 w-full h-full">
          <ScrollContainer auto>
            <Tab.Panels className="px-10 py-4 bg-elevation-3 rounded-sm shadow-lg w-full h-fit">
              <Tab.Panel as={Fragment}>
                <DisplayPanel />
              </Tab.Panel>
              <Tab.Panel as={Fragment}>
                <ThemePanel />
              </Tab.Panel>
              <Tab.Panel>
                <GameBehaviorPanel />
              </Tab.Panel>
              <Tab.Panel>
                <SoundPanel />
              </Tab.Panel>

              {/*              
              <Tab.Panel>
                <ChangePasswordForm />
              </Tab.Panel> */}
            </Tab.Panels>
          </ScrollContainer>
        </div>
      </DashboardGrid>
    </Tab.Group>
  );
}

function OptionsMenu() {
  const isMobile = useMediaQuery("only screen and (max-width: 640px)");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const tabList = [
    // { label: "Profile", value: 0 },
    { label: "Account", value: 0 },
    { label: "Display", value: 1 },
    { label: "Theme", value: 2 },
    { label: "Game Behavior", value: 3 },
    { label: "Sound", value: 4 },
  ];
  const currentTab = useMemo(() => tabList.find((tab) => tab.value === selectedIndex), [selectedIndex]);
  return (
    <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex} vertical>
      {isMobile && (
        <>
          <Select
            className="mb-4 mx-4"
            options={tabList}
            value={selectedIndex}
            onChange={(value) => {
              setSelectedIndex(value);
            }}
          />
          <Tab.List className="hidden flex-col">
            <MenuTab>Account</MenuTab>
            {/* <MenuTab>Profile</MenuTab> */}
            <MenuTab>Display</MenuTab>
            <MenuTab>Board/Piece Theme</MenuTab>
            <MenuTab>Game Behavior</MenuTab>
            <MenuTab>Sound</MenuTab>
            {/* <MenuTab>Puzzles</MenuTab>
            <MenuTab>Change Password</MenuTab> */}
          </Tab.List>
        </>
      )}

      <DashboardGrid>
        <>
          {!isMobile && (
            <Panel
              size="sm"
              height="fit-content"
              className="col-span-3 sm:col-span-6 lg:col-span-3 xl:col-span-3 h-0 sm:h-fit"
            >
              <Tab.List className="hidden sm:flex flex-col">
                {/* <MenuTab>Profile</MenuTab> */}
                <MenuTab>Account</MenuTab>
                <MenuTab>Display</MenuTab>
                <MenuTab>Board & Piece Theme</MenuTab>
                <MenuTab>Game Behavior</MenuTab>
                <MenuTab>Sound</MenuTab>
                {/* <MenuTab>Puzzles</MenuTab>
                <MenuTab>Change Password</MenuTab> */}
              </Tab.List>
            </Panel>
          )}
        </>
        <div className="relative col-span-12 sm:col-span-6 lg:col-span-9 xl:col-span-9 w-full h-full">
          <ScrollContainer auto>
            <Tab.Panels className="px-10 py-4 bg-elevation-2 rounded-sm shadow-lg w-full h-fit">
              <Tab.Panel>
                <AccountPanel />
              </Tab.Panel>
              <Tab.Panel as={Fragment}>
                <DisplayPanel />
              </Tab.Panel>
              <Tab.Panel as={Fragment}>
                <ThemePanel />
              </Tab.Panel>
              <Tab.Panel>
                <GameBehaviorPanel />
              </Tab.Panel>
              <Tab.Panel>
                <SoundPanel />
              </Tab.Panel>

              {/*              
              <Tab.Panel>
                <ChangePasswordForm />
              </Tab.Panel> */}
            </Tab.Panels>
          </ScrollContainer>
        </div>
      </DashboardGrid>
    </Tab.Group>
  );
}

interface TabProps {
  children?: JSX.Element | string;
}

function MenuTab({ children }: TabProps) {
  return (
    <Tab as={Fragment}>
      {({ selected }) => (
        /* Use the `selected` state to conditionally style the selected tab. */
        <button
          className={`text-lg p-3 px-6 text-left ${
            selected
              ? "text-white border-r-4 border-gold-200 bg-gradient-to-b from-gold-100/[0.08] to-gold-100/[0.1] focus:outline-none"
              : "text-white/[0.5]"
          }`}
        >
          {children}
        </button>
      )}
    </Tab>
  );
}

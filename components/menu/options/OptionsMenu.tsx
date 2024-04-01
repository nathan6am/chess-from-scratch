import { PageContainer } from "@/components/base/Layout";
import { DashboardGrid, Panel } from "@/components/dashboard";
import { Label, PageTitle } from "@/components/base/Typography";

import React, { Fragment, useState, useContext } from "react";
import { RadioGroup, Tab } from "@headlessui/react";
import { SettingsContext } from "@/context/settings";
import { Toggle, RadioButton, RangeSlider } from "@/components/base";

import ChangePasswordForm from "@/components/forms/ChangePasswordForm";
import VolumeSlider from "./VolumeSlider";
import { ScrollContainer } from "@/components/layout/GameLayout";
import BoardSelect from "./BoardSelect";
import PieceSetSelect from "./PieceSetSelect";
import { BsDisplay, BsVolumeUpFill } from "react-icons/bs";
import { FaPaintBrush } from "react-icons/fa";
import { IoGameController } from "react-icons/io5";
import { PanelHeader } from "@/components/base/Typography";
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
  return (
    <div className="flex flex-row w-full h-full">
      <Tab.Group vertical>
        <Tab.List className="flex flex-col w-[30rem] lg:w-[40rem] m-10 rounded-md overflow-hidden bg-elevation-2 h-fit shadow-md">
          <div className="text-lg font-medium p-3 px-6 text-left border-b border-white/[0.2] bg-white/[0.1]">
            Preferences
          </div>
          <MenuTab>Display</MenuTab>
          <MenuTab>Theme</MenuTab>
          <MenuTab>Game Behavior</MenuTab>
          <MenuTab>Sound</MenuTab>
        </Tab.List>
        <div className="my-10 mr-10 h-inherit w-full relative rounded-l-lg overflow-hidden">
          <ScrollContainer auto>
            <Tab.Panels className="px-10 py-4 bg-white/[0.05] rounded-l-lg shadow-lg w-full h-fit shadow-none">
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
            </Tab.Panels>
          </ScrollContainer>
        </div>
      </Tab.Group>
    </div>
  );
}
function OptionsMenu() {
  const isMobile = useMediaQuery("only screen and (max-width: 640px)");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [visibility, setVisibility] = useState<string>("private");
  const tabList = [
    { label: "Profile", value: 0 },
    { label: "Display", value: 1 },
    { label: "Theme", value: 2 },
    { label: "Game Behavior", value: 3 },
    { label: "Sound", value: 4 },
    { label: "Puzzles", value: 5 },
    { label: "Change Password", value: 6 },
    { label: "Close Account", value: 7 },
  ];
  const currentTab = useMemo(
    () => tabList.find((tab) => tab.value === selectedIndex),
    [selectedIndex]
  );
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
            <MenuTab>Profile</MenuTab>
            <MenuTab>Display</MenuTab>
            <MenuTab>Theme</MenuTab>
            <MenuTab>Game Behavior</MenuTab>
            <MenuTab>Sound</MenuTab>
            <MenuTab>Puzzles</MenuTab>
            <MenuTab>Change Password</MenuTab>
            <MenuTab>Close Account</MenuTab>
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
                <MenuTab>Profile</MenuTab>
                <MenuTab>Display</MenuTab>
                <MenuTab>Theme</MenuTab>
                <MenuTab>Game Behavior</MenuTab>
                <MenuTab>Sound</MenuTab>
                <MenuTab>Puzzles</MenuTab>
                <MenuTab>Change Password</MenuTab>
                <MenuTab>Close Account</MenuTab>
              </Tab.List>
            </Panel>
          )}
        </>
        <div className="relative col-span-12 sm:col-span-6 lg:col-span-9 xl:col-span-9 w-full h-full">
          <ScrollContainer auto>
            <Tab.Panels className="px-10 py-4 bg-elevation-2 rounded-sm shadow-lg w-full h-fit">
              <Tab.Panel>
                <RadioGroup value={visibility} onChange={setVisibility}>
                  <RadioGroup.Label>Visibility</RadioGroup.Label>
                  <RadioButton value="private" label="Private" />
                  <RadioButton value="unlisted" label="Unlisted" />
                  <RadioButton value="public" label="Public" />
                </RadioGroup>
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
              <Tab.Panel>Content 5</Tab.Panel>
              <Tab.Panel>
                <ChangePasswordForm />
              </Tab.Panel>
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

function GameBehaviorPanel() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div className="">
      <h2 className="text-lg mb-4 text-gold-100">
        <IoGameController className="inline mr-1 mb-0.5" /> Game Behavior
      </h2>
      <RadioGroup
        className="py-2"
        value={settings.gameBehavior.movementType}
        onChange={(value: "click" | "drag" | "both") => {
          updateSettings({
            gameBehavior: {
              ...settings.gameBehavior,
              movementType: value,
            },
          });
        }}
      >
        <RadioGroup.Label className="text-lg">Piece Movement Type</RadioGroup.Label>
        <RadioButton value="click" label="Click Squares" />
        <RadioButton value="drag" label="Drag and Drop" />
        <RadioButton value="both" label="Both" />
      </RadioGroup>
      <Toggle
        className="my-4"
        labelClasses="ml-2 "
        reverse
        checked={settings.gameBehavior.allowPremoves}
        label="Enable Premoves"
        onChange={(enabled) => {
          updateSettings({
            gameBehavior: {
              ...settings.gameBehavior,
              allowPremoves: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-4"
        labelClasses="ml-2 "
        reverse
        checked={settings.gameBehavior.autoQueen}
        label="Auto-Promote to Queen"
        onChange={(enabled) => {
          updateSettings({
            gameBehavior: {
              ...settings.gameBehavior,
              autoQueen: enabled,
            },
          });
        }}
      />
    </div>
  );
}

function ThemePanel() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div className="">
      <h2 className="text-lg mb-4 text-gold-100">
        <FaPaintBrush className="inline mr-1 mb-0.5" /> Theme Settings
      </h2>
      <BoardSelect
        value={settings.display.boardTheme}
        onChange={(value) => {
          updateSettings({
            display: {
              ...settings.display,
              boardTheme: value,
            },
          });
        }}
      />
      <PieceSetSelect
        value={settings.display.pieceTheme}
        onChange={(value) => {
          updateSettings({
            display: {
              ...settings.display,
              pieceTheme: value,
            },
          });
        }}
      />
    </div>
  );
}

function DisplayPanel() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div className="">
      <h2 className="text-lg mb-4 text-gold-100">
        <BsDisplay className="inline mr-1 mb-0.5" /> Display Settings
      </h2>
      <RadioGroup
        className="mb-3"
        value={settings.display.animationSpeed}
        onChange={(value: "slow" | "fast" | "normal" | "disabled") => {
          updateSettings({
            display: {
              ...settings.display,
              animationSpeed: value,
            },
          });
        }}
      >
        <RadioGroup.Label className="text-lg">Animation Speed</RadioGroup.Label>
        <RadioButton value="slow" label="Slow" />
        <RadioButton value="normal" label="Normal" />
        <RadioButton value="fast" label="Fast" />
        <RadioButton value="disabled" label="Disabled" />
      </RadioGroup>
      <p className="opacity-50 mt-4"> Board Settings</p>
      <RadioGroup
        className="mb-4"
        value={settings.display.showCoordinates}
        onChange={(value: "inside" | "outside" | "hidden") => {
          updateSettings({
            display: {
              ...settings.display,
              showCoordinates: value,
            },
          });
        }}
      >
        <RadioGroup.Label className="text-lg">Show Coordinates</RadioGroup.Label>
        <RadioButton value="inside" label="Inside Board" />
        <RadioButton value="outside" label="Outside Board" />
        <RadioButton value="hidden" label="Hidden" />
      </RadioGroup>
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.display.showHighlights}
        label="Show Board Highlights"
        onChange={(enabled) => {
          updateSettings({
            display: {
              ...settings.display,
              showHighlights: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.display.showValidMoves}
        label="Show Move Targets"
        onChange={(enabled) => {
          updateSettings({
            display: {
              ...settings.display,
              showValidMoves: enabled,
            },
          });
        }}
      />
      <p className="opacity-50 mt-4"> Move Notation</p>
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.display.usePieceIcons}
        label="Use Piece Icons"
        onChange={(enabled) => {
          updateSettings({
            display: {
              ...settings.display,
              usePieceIcons: enabled,
            },
          });
        }}
      />
    </div>
  );
}

function SoundPanel() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div>
      <PanelHeader className="mb-4">
        <BsVolumeUpFill className="inline mr-1 mb-0.5" /> Sound Settings
      </PanelHeader>
      <Label>Volume</Label>
      <div className="max-w-xs ml-[-8px]">
        <RangeSlider
          min={0}
          max={100}
          step={5}
          minThumbClassName="hidden"
          lock={new Set(["min"])}
          onChange={([_min, max]) => {
            updateSettings({
              sound: {
                ...settings.sound,
                volume: max,
              },
            });
          }}
          value={[0, settings.sound.volume]}
        />
      </div>
      <VolumeSlider
        value={settings.sound.volume}
        onChange={(value) => {
          updateSettings({
            sound: {
              ...settings.sound,
              volume: value,
            },
          });
        }}
      />
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.sound.moveSounds}
        label="Move Sounds"
        onChange={(enabled) => {
          updateSettings({
            sound: {
              ...settings.sound,
              moveSounds: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.sound.invalidMoveSounds}
        label="Invalid Move Warning"
        onChange={(enabled) => {
          updateSettings({
            sound: {
              ...settings.sound,
              invalidMoveSounds: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.sound.lowTimeWarning}
        label="Low Time Warning"
        onChange={(enabled) => {
          updateSettings({
            sound: {
              ...settings.sound,
              lowTimeWarning: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.sound.notifcationSounds}
        label="Notication Sounds"
        onChange={(enabled) => {
          updateSettings({
            sound: {
              ...settings.sound,
              notifcationSounds: enabled,
            },
          });
        }}
      />
    </div>
  );
}

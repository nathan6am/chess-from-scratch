import React, { Fragment } from "react";
import { Tab } from "@headlessui/react";
export default function Options() {
  return (
    <div className="flex flex-row w-full h-full">
      <MyTabs />
    </div>
  );
}

function MyTabs() {
  return (
    <Tab.Group vertical>
      <Tab.List className="flex flex-col w-80 m-10 rounded-md overflow-hidden bg-[#1f1f1f] h-fit shadow-md">
        <div className="text-lg font-medium p-3 px-6 text-left border-b border-white/[0.2] bg-white/[0.1]">
          Options
        </div>
        <MenuTab>Profile</MenuTab>
        <MenuTab>Display</MenuTab>
        <MenuTab>Game Behavior</MenuTab>
        <MenuTab>Sound</MenuTab>
        <MenuTab>Puzzles</MenuTab>
        <MenuTab>Analysis</MenuTab>
        <MenuTab>Privacy</MenuTab>
        <MenuTab>Change Password</MenuTab>
        <MenuTab>Close Account</MenuTab>
      </Tab.List>
      <Tab.Panels>
        <Tab.Panel>Content 1</Tab.Panel>
        <Tab.Panel>Content 2</Tab.Panel>
        <Tab.Panel>Content 3</Tab.Panel>
        <Tab.Panel>Content 4</Tab.Panel>
        <Tab.Panel>Content 5</Tab.Panel>
      </Tab.Panels>
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
              ? "text-white border-r-4 border-sepia bg-gradient-to-b from-sepia/[0.08] to-sepia/[0.1] focus:outline-none"
              : "text-white/[0.5]"
          }`}
        >
          {children}
        </button>
      )}
    </Tab>
  );
}

import React from "react";
import GameSearch from "@/components/menu/GameSearch";
import GameList from "@/components/menu/GameList";
import { Tab } from "@headlessui/react";
import classNames from "classnames";
export default function Profile() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full p-8 bg-elevation-1">
        <h3 className="w-fit text-lg">Profile Placeholder</h3>
      </div>
      <Tab.Group>
        <div className="w-full flex flex-row items-center justify-start bg-elevation-1">
          <StyledTab>Game Archive</StyledTab>
          <StyledTab>Stats</StyledTab>
          <StyledTab>Insights</StyledTab>
        </div>
        <Tab.Panel className="w-full grow flex flex-col">
          <GameSearch />
        </Tab.Panel>
        <Tab.Panel className="w-full grow flex flex-col">Stats coming soon</Tab.Panel>
        <Tab.Panel className="w-full grow flex flex-col">Insights coming soon</Tab.Panel>
      </Tab.Group>
      <div className="w-full grow"></div>
    </div>
  );
}

function StyledTab({ children }: { children: string | JSX.Element | (string | JSX.Element)[] }) {
  return (
    <Tab
      className={({ selected }) =>
        classNames(
          "flex-1 border-b border-b-4 py-2 text-md max-w-[10em] px-4",
          "focus:outline-none ",
          selected
            ? "bg-elevation-1 border-gold-300 text-light-100"
            : "bg-elevation-1 border-elevation-1 text-light-300 hover:bg-elevation-1 hover:border-gold-300 hover:text-light-100"
        )
      }
    >
      {children}
    </Tab>
  );
}

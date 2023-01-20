import React, { useCallback, useState } from "react";
import MenuTopBar from "./MenuTopBar";
import MenuSideBar from "./MenuSideBar";
import { OptionsContent, PlayContent, ProfileContent, PuzzlesContent, StudyContent } from "./content";
const tabs: Array<{ label: string; key: string }> = [
  { label: "Play", key: "play" },
  { label: "Puzzles", key: "puzzles" },
  { label: "Study", key: "study" },
  { label: "Options", key: "options" },
  { label: "Profile", key: "profile" },
];

export default function MainMenu() {
  const [activeTab, setActiveTab] = useState("play");
  const onChange = (key: string) => {
    setActiveTab(key);
  };
  return (
    <div className="md:h-[90%] max-w-[140vh] w-full flex flex-col backdrop-blur-lg bg-[#121212] rounded-lg overflow-hidden shadow-lg">
      <MenuTopBar />
      <div className="flex flex-col lg:grid lg:grid-cols-5 w-full grow bg-[#181818]">
        <div className="flex flex-col h-fit lg:py-20 rounded-l-md col-span-5 lg:col-span-1 lg:h-full w-full items-end justify-start  bg-[#1f1f1f]">
          <MenuSideBar activeKey={activeTab} onChange={onChange} tabs={tabs} />
        </div>
        <div className="h-full w-full grow lg:col-span-4">
          <MenuContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}

interface MenuContentProps {
  activeTab: string;
}
function MenuContent({ activeTab }: MenuContentProps) {
  switch (activeTab) {
    case "play":
      return <PlayContent />;
    case "study":
      return <StudyContent />;
    case "options":
      return <OptionsContent />;
    case "profile":
      return <ProfileContent />;
    case "puzzles":
      return <PuzzlesContent />;
    default:
      return <></>;
  }
}

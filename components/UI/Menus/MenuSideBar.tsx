import React, { useState } from "react";

interface Props {
  activeKey: string;
  onChange: (key: string) => void;
  tabs: Array<{ label: string; key: string }>;
}

export default function MenuSideBar({ activeKey, onChange, tabs }: Props) {
  return (
    <div className="w-full relative">
      <div className="absolute top-0 left-[70%] right-0 bottom-0 bg-gradient-to-r from-transparent to-[#1f1f1f] z-10 md:hidden pointer-none"></div>
      <aside className="flex flex-row lg:flex-col h-fit w-full justify-start items-end px-4 lg:px-10 overflow-x-scroll pr-20 md:pr-4 scrollbar-hide relative">
        {tabs.map((tab) => (
          <MenuButton
            activeKey={activeKey}
            key={tab.key}
            tabKey={tab.key}
            title={tab.label}
            onSelect={() => {
              onChange(tab.key);
            }}
          />
        ))}
      </aside>
    </div>
  );
}

interface ButtonProps {
  title: string;
  activeKey: string;
  tabKey: string;
  onSelect: () => void;
}

function MenuButton({ activeKey, tabKey, onSelect, title }: ButtonProps) {
  const active = tabKey === activeKey;
  return (
    <button
      title={title}
      onClick={(e) => {
        e.preventDefault;
        onSelect();
      }}
      className={`my-4 focus:outline-none text-lg md:text-xl mx-4 min-w-[60px] md:min-w-[100px] lg:min-w-0 lg:pl-2 pb-1 border-y-4 border-t-transparent ${
        active ? "border-b-sepia text-white" : "text-white/[0.7] border-transparent hover:text-white"
      }`}
    >
      {title}
    </button>
  );
}

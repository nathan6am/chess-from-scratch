import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
interface Props {
  pages: Array<{ label: string; key: string; href: string }>;
}

export default function SideBar({ pages }: Props) {
  const { pathname } = useRouter();
  const activeKey = useMemo(() => {
    const currentPage = pages.find((page) => pathname.startsWith(page.href));
    if (currentPage) return currentPage.key;
    return "play";
  }, [pathname, pages]);
  return (
    <div className="w-full relative">
      <div className="absolute top-0 left-[70%] right-0 bottom-0 bg-gradient-to-r from-transparent to-elevation-2 z-10 md:hidden pointer-none"></div>
      <aside className="flex flex-row lg:flex-col h-fit w-full justify-start items-end px-4 lg:px-10 overflow-x-scroll pr-20 md:pr-4 scrollbar-hide relative">
        {pages.map((page) => (
          <MenuButton
            activeKey={activeKey}
            key={page.key}
            pageKey={page.key}
            title={page.label}
            href={page.href}
          />
        ))}
      </aside>
    </div>
  );
}

interface ButtonProps {
  title: string;
  activeKey: string;
  pageKey: string;
  href: string;
}

function MenuButton({ activeKey, pageKey, href, title }: ButtonProps) {
  const active = pageKey === activeKey;
  return (
    <Link
      title={title}
      href={href}
      className={`my-4 focus:outline-none text-center text-lg md:text-xl mx-4 min-w-[60px] md:min-w-[100px] lg:min-w-0 lg:pl-2 pb-1 border-y-4 border-t-transparent ${
        active
          ? "border-b-gold-200 text-light-100"
          : "text-light-200 border-transparent hover:text-light-100"
      }`}
    >
      {title}
    </Link>
  );
}

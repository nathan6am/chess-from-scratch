import React, { useMemo, useState } from "react";
import useAuth from "@/hooks/queries/useAuth";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import OptionsOverlay from "../dialogs/OptionsOverlay";
//icons
import { BsArrowBarRight, BsArrowBarLeft } from "react-icons/bs";
import { FaPuzzlePiece, FaUser } from "react-icons/fa";
import { MdSchool, MdLogout, MdOutlineHelpOutline, MdSettings } from "react-icons/md";
import { IoMdPlay, IoMdOptions } from "react-icons/io";

//hooks
import { useRouter } from "next/router";

//components
import { Button, IconButton, Logo } from "@/components/base";
import Link from "next/link";

//utils
import cn from "@/util/cn";

interface SidebarProps {
  toggle: () => void;
  collapse: boolean;
  pages: Array<{ label: string; key: string; href: string }>;
}
export default function SideMenu({ toggle, collapse, pages }: SidebarProps) {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const router = useRouter();
  const { pathname } = router;
  const { signOut, user } = useAuth();
  const activeKey = useMemo(() => {
    const currentPage = pages.find((page) => pathname.startsWith(page.href));
    if (currentPage) return currentPage.key;
    return "play";
  }, [pathname, pages]);
  return (
    <div
      className={cn(
        "h-screen z-[100] w-[240px] h-full flex flex-col fixed justify-between overflow-y-auto overflow-x-hidden",
        "border-r border-elevation-4 bg-elevation-2",
        "trasition ease-in-out duration-500",
        {
          "translate-x-[-240px] sm:translate-x-[-180px]": collapse,
          "translate-x-0": !collapse,
        }
      )}
    >
      <OptionsOverlay isOpen={showOptions} closeModal={() => setShowOptions(false)} />
      <ConfirmationDialog
        title="Logout?"
        message="Are you sure you want to logout?"
        onConfirm={signOut}
        isOpen={showSignOutDialog}
        closeModal={() => setShowSignOutDialog(false)}
        confirmText="Logout"
        cancelText="Cancel"
        onCancel={() => setShowSignOutDialog(false)}
      />
      <nav className="flex flex-col">
        <div className="flex flex-row h-16 items-center pl-3 pr-0 border-light-500 justify-between">
          <Logo />
          <span className="w-[60px] h-full flex items-center justify-center">
            <IconButton iconSize="1.5em" icon={collapse ? BsArrowBarRight : BsArrowBarLeft} onClick={toggle} />
          </span>
        </div>

        <ul className="">
          <MenuItem
            icon={IoMdPlay}
            iconSize={24}
            activeKey={activeKey}
            pageKey="play"
            collapse={collapse}
            href="/play"
            label="Play Chess"
          />
          <MenuItem
            icon={MdSchool}
            iconSize={24}
            activeKey={activeKey}
            pageKey="study"
            href="/study"
            label="Study"
            collapse={collapse}
          />
          <MenuItem
            icon={FaPuzzlePiece}
            iconSize={22}
            activeKey={activeKey}
            pageKey="puzzles"
            href="/puzzles"
            label="Puzzles"
            collapse={collapse}
          />
          <MenuItem
            icon={MdSettings}
            iconSize={24}
            activeKey={activeKey}
            pageKey="options"
            href="/options"
            label="Options"
            collapse={collapse}
          />
          {user?.type !== "guest" && (
            <MenuItem
              icon={FaUser}
              activeKey={activeKey}
              pageKey="profile"
              href="/profile"
              label="My Profile"
              collapse={collapse}
            />
          )}
        </ul>
        <div
          className={cn({
            hidden: collapse,
          })}
        >
          <p className="text-sm text-light-300 p-4 text-center">{`Signed in as: ${user?.username}`}</p>
        </div>
        <div
          className={cn("px-4", {
            hidden: collapse || !user || user.type !== "guest",
          })}
        >
          <Button
            className="w-full mt-4"
            size="md"
            variant="primary"
            label="Login"
            onClick={() => {
              router.push("/login");
            }}
          />
          <Button
            className="w-full mt-4"
            size="md"
            variant="neutral"
            label="Sign Up"
            onClick={() => {
              router.push("/signup");
            }}
          />
        </div>
      </nav>

      <div
        className={cn("w-full flex", {
          "justify-end": collapse,
          "justify-center": !collapse,
        })}
      >
        <div
          className={cn("flex items-center justify-between mb-4  rounded-md shadow bg-elevation-3", {
            "flex-col mr-0 w-[44px] px-auto py-2 gap-y-2 mr-[8px]": collapse,
            "flex-row mx-4 px-4 p-2 w-full ": !collapse,
          })}
        >
          <IconButton
            data-tooltip-content="Help"
            data-tooltip-delay-show={300}
            data-tooltip-place={collapse ? "right" : "top"}
            data-tooltip-id="my-tooltip"
            icon={MdOutlineHelpOutline}
          />

          <IconButton
            // data-tooltip-content="User Preferences"
            // data-tooltip-delay-show={300}
            // data-tooltip-place={collapse ? "right" : "top"}
            // data-tooltip-id="my-tooltip"
            icon={IoMdOptions}
            onClick={() => {
              setShowOptions(true);
            }}
          />

          <IconButton
            data-tooltip-content="Logout"
            data-tooltip-delay-show={300}
            data-tooltip-place={collapse ? "right" : "top"}
            data-tooltip-id="my-tooltip"
            icon={MdLogout}
            onClick={() => {
              setShowSignOutDialog(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface MenuItemProps {
  icon: React.FC<any>;
  activeKey: string;
  pageKey: string;
  label: string;
  href: string;
  collapse: boolean;
  iconSize?: number;
}

const MenuItem = ({ icon: Icon, pageKey, activeKey, label, href, collapse, iconSize }: MenuItemProps) => {
  const active = activeKey === pageKey;
  return (
    <Link href={href}>
      <li
        className={cn("cursor-pointer py-3 px-8 flex flex-row group border-l-4 border-transparent", {
          "bg-elevation-4 text-light-200 border-gold-200": active,
          "hover:bg-elevation-3 text-light-200 hover:text-light-200": !active,
        })}
      >
        <span className="w-8 mr-6 flex flex-row justify-center items-center">
          <Icon
            className={cn({
              "fill-gold-200 text-gold-200": active,
              "fill-light-300 text-light-300 group-hover:fill-gold-200 group-hover:text-gold-200": !active,
              "sm:mr-0 sm:translate-x-[160px]": collapse,
            })}
            size={iconSize || 20}
          />
        </span>
        {!collapse && label}
      </li>
    </Link>
  );
};

import React, { useContext, useEffect } from "react";
import { UserContext } from "@/context/user";
import Knight from "@/public/assets/knight.svg";
import { FiLogOut } from "react-icons/fi";
import { MdSettings, MdPerson } from "react-icons/md";
import { IoPersonCircle } from "react-icons/io5";
import { useRouter } from "next/router";
export default function MenuTopBar() {
  return (
    <div className="w-full py-3 px-4 bg-white/[0.1] rounded-t-lg">
      <div className="flex flex-row justify-between">
        <Logo />
        <ActionButtons />
      </div>
    </div>
  );
}

const Logo = () => (
  <div className="flex flex-row items-end">
    <h1 className="text-xl font-extrabold text-white flex flex-row items-end">
      <Knight className="fill-[#CDA882] inline h-8 w-8 ml-4" />
      NextChess
    </h1>
    <p className="text-white text-right font-regular text-xs opacity-10 ml-2 mb-[2px]">v 0.1.0</p>
  </div>
);

const ActionButtons = () => {
  const router = useRouter();
  const user = useContext(UserContext);
  const onLogout = () => {
    fetch("/auth/logout", {
      method: "GET",
    }).then(() => {
      router.push("/login");
    });
  };

  return (
    <div className="flex flex-row justify-end items-center text-white/[0.5]">
      <p className="mr-3">Welcome, {user?.name}</p>
      <button onClick={() => {}}>
        <IoPersonCircle className="h-6 w-6 mx-1 hover:text-sepia" />
      </button>
      <button onClick={() => {}}>
        <MdSettings className="h-6 w-6 mx-1 hover:text-sepia" />
      </button>
      <button onClick={onLogout}>
        <FiLogOut className="h-6 w-6 mx-1 hover:text-sepia" />
      </button>
    </div>
  );
};

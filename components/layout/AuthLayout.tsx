import React from "react";
interface Props {
  children?: JSX.Element | JSX.Element[];
}
export default function AuthLayout({ children }: Props) {
  return (
    <div className=" min-h-[85%] max-w-screen lg:max-w-[1420px] w-full backdrop-blur-lg bg-gradient-to-r from-[#1f1f1f]/[0.5] to-[#181818]/[0.5] flex flex-col justify-center items-center overflow-hidden sm:rounded-lg shadow-lg ">
      {children}
    </div>
  );
}

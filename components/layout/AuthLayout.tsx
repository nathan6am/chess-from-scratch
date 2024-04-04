import React from "react";

interface Props {
  children?: JSX.Element | JSX.Element[];
}
export default function AuthLayout({ children }: Props) {
  return (
    <Background>
      <div className=" min-h-[85%] max-w-screen lg:max-w-[1420px] w-full backdrop-blur-lg bg-gradient-to-r from-[#1f1f1f]/[0.5] to-[#181818]/[0.5] flex flex-col justify-center items-center overflow-hidden sm:rounded-lg shadow-lg ">
        {children}
      </div>
    </Background>
  );
}

export function Background({ children }: Props) {
  return (
    <div
      style={{
        backgroundImage: `url("/assets/background.png")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        overflowX: "hidden",
        backgroundPosition: "bottom 0 left 0",
        backgroundAttachment: "fixed",
      }}
      className="grid grid-cols-1 w-screen max-w-screen min-h-screen justify-center items-start "
    >
      <div className="h-full w-full justify-center items-center flex grid-cols-auto">
        <div className="flex container justify-center items-center w-full h-full">{children}</div>
      </div>
    </div>
  );
}

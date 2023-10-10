import React from "react";
interface Props {
  children?: JSX.Element | JSX.Element[];
}
export default function AppLayout({ children }: Props) {
  return (
    <div>
      <div className=" min-h-screen lg:h-screen  w-full  justify-center items-center flex bg-elevation-0">
        <main className="flex justify-center items-center w-full h-full">
          <div className="h-full w-full w-full flex justify-center items-center">{children}</div>
        </main>
      </div>
    </div>
  );
}

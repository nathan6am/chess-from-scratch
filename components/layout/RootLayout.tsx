import React from "react";
interface Props {
  children?: JSX.Element | JSX.Element[];
}
export default function RootLayout({ children }: Props) {
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
        <main className="flex container justify-center items-center w-full h-full">
          {children}
        </main>
      </div>
    </div>
  );
}

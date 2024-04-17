import React from "react";

interface Props {
  children?: JSX.Element | string | Array<JSX.Element | string>;
}
export default function ReadOnlyNotification({ children }: Props) {
  return (
    <div className="fixed z-[9999] inset-0 pointer-none">
      <div className="top-0 left-0 right-0 absolute flex justify-center">{children}</div>
    </div>
  );
}

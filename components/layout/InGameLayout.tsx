import React from "react";
interface Props {
  children?: JSX.Element | JSX.Element[];
}
export default function AuthLayout({ children }: Props) {
  return (
    <div>
      AuthLayout<div>{children}</div>
    </div>
  );
}

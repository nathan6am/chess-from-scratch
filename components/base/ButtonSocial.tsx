import React, { MouseEventHandler } from "react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import axios from "axios";
type variant = "google" | "facebook" | "guest" | "discord";
interface Props {
  variant?: variant;
  theme?: "dark" | "light";
  onClick?: MouseEventHandler;
  href: string;
  children?: string | JSX.Element | JSX.Element[];
  className?: string;
}
export default function ButtonSocial({ variant, onClick, href, children, className }: Props) {
  switch (variant) {
    case "google":
      return (
        <a href={href} className={`group my-2 rounded-md w-full group flex flex-row ${className}`}>
          <div className="group-hover:bg-google-800 bg-google-700 aspect-square py-auto px-2 rounded-l-md flex items-center justify-center border-r-2 border-black/[0.1]">
            <FaGoogle className="text-white text-xl" />
          </div>
          <div className="text-white group-hover:bg-google-700 flex-grow bg-google-600 h-full py-2 pr-8 text-center w-full rounded-r-md">
            {children || "Sign In with Google"}
          </div>
        </a>
      );

    case "facebook":
      return (
        <a href={href} className={`group my-2 rounded-md w-full group flex flex-row ${className}`}>
          <div className="group-hover:bg-facebook-900 bg-facebook-800 aspect-square px-2 py-auto rounded-l-md flex items-center justify-center border-r-2 border-black/[0.1]">
            <FaFacebook className="text-white text-xl" />
          </div>
          <div className=" text-white group-hover:bg-facebook-800 flex-grow bg-facebook-700 h-full py-2 pr-8 text-center w-full rounded-r-md">
            {children || "Sign In with Facebook"}
          </div>
        </a>
      );

    case "guest":
      return (
        <a href={href} className={`group my-2 rounded-md w-full group flex flex-row ${className}`}>
          <div className="text-white group-hover:bg-neutral-700 w-full bg-neutral-600 h-full py-2 text-center w-full rounded-md">
            Continue as Guest
          </div>
        </a>
      );

    default:
      return (
        <a href={href} className={`group my-4 rounded-md w-full group flex flex-row`}>
          <div className="text-white group-hover:bg-neutral-700 w-full bg-neutral-600 h-full py-2 text-center w-full rounded-md">
            Continue with Google
          </div>
        </a>
      );
  }
}

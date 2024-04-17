import React, { Fragment, useState, useRef, useEffect } from "react";
import { SyncLoader, BeatLoader } from "react-spinners";
import { Transition } from "@headlessui/react";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";
import { MdContentCopy, MdCancel } from "react-icons/md";
import { useRouter } from "next/router";
import { Button } from "../base";
import { Tooltip } from "react-tooltip";
import useDebounce from "@/hooks/utils/useDebounce";
interface Props {
  lobbyUrl: string;
  onLeave?: () => void;
}
export default function Waiting({ lobbyUrl }: Props) {
  const router = useRouter();
  return (
    <div className="container flex justify-center items-center">
      <Tooltip
        id="copy-tooltip"
        openOnClick={true}
        style={{
          backgroundColor: "#161616",
          color: "#dddddd",
          opacity: "96%",
          padding: "0.25em 0.5em",
          zIndex: 300,
          backdropFilter: "blur(10px)",
          borderRadius: "0.25em",
          maxWidth: "30em",
        }}
      ></Tooltip>
      <div className="w-full flex flex-col items-center justify-center ">
        <h2 className="w-full py-4 md:py-8 text-md text-center flex flex-row items-baseline justify-center bg-elevation-4 ">
          Waiting for opponent to join <BeatLoader className="inline ml-1" size={5} color="white" />
        </h2>
        <LobbyLink lobbyUrl={lobbyUrl} />
        <Button
          onClick={() => {
            router.push("/play");
          }}
          variant="danger"
          icon={MdCancel}
          iconClassName="mr-1 text-lg mt-0.5"
          label="Abort Challenge"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function LobbyLink({ lobbyUrl }: Props) {
  const tooltipRef = useRef(false);
  useEffect(() => {
    if (tooltipRef.current) {
      tooltipRef.current = false;
    }
  }, [tooltipRef.current]);

  const tooltipVisible = useDebounce(tooltipRef.current, 2000);
  return (
    <div className="w-full p-6 bg-elevation-3">
      <p className="text-sm opacity-50">Share this link to invite a friend to join the game</p>
      <div className="flex flex-row rounded-md my-4 min-w-[400px]  overflow-hidden">
        <div className="px-4 py-2  text-sm pr-8 bg-[#121212] rounded-l-md border-white/[0.5] border-y-1 border-l-1 grow">
          {lobbyUrl}
        </div>
        <button
          data-tooltip-content="Copied to Clipboard!"
          data-tooltip-id="copy-tooltip"
          data-tooltip-delay-hide={1000}
          onClick={(e) => {
            tooltipRef.current = true;
            navigator.clipboard.writeText(lobbyUrl);
          }}
          className="py-2 px-2 w-fit z-10 bg-elevation-4 relative hover:text-gold-100 hover:bg-elevation-5 rounded-r-md"
        >
          <MdContentCopy />
        </button>
      </div>
      <p className="text-sm opacity-50">The first player to user this link will be your opponent</p>
    </div>
  );
}

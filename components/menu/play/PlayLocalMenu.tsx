import React, { useState } from "react";
import { Toggle, Button } from "@/components/base";
import { IoMdPlay } from "react-icons/io";
import * as Chess from "@/lib/chess";
import TimeControlSelect from "./TimeControlSelect";
import { useRouter } from "next/router";
export default function PlayLocalMenu() {
  const router = useRouter();
  const [autoFlip, setAutoFlip] = useState(false);
  const [invertPieces, setInvertPieces] = useState(false);
  const [timed, setTimed] = useState(false);
  const [timeControl, setTimeControl] = useState<Chess.TimeControl | undefined>();
  return (
    <div className="w-full max-w-md">
      <Toggle label="Flip Board on Turn" className="my-2 w-fit" checked={autoFlip} onChange={setAutoFlip} reverse />
      <Toggle
        label="Invert Opposing Pieces"
        className="my-2 w-fit"
        checked={invertPieces}
        onChange={setInvertPieces}
        reverse
      />
      <Toggle label="Timed Game" className="my-2 w-fit" checked={timed} onChange={setTimed} reverse />
      {timed && <TimeControlSelect setTimeControl={setTimeControl} />}
      <Button
        onClick={() => {
          router.push(
            `/play/local?${invertPieces ? "invertOpposingPieces=true" : "invertOpposingPieces=false"}&autoFlip=${
              autoFlip ? "true" : "false"
            }${
              timed && timeControl ? `&timeControl=${timeControl.timeSeconds / 60}+${timeControl.incrementSeconds}` : ""
            }`
          );
        }}
        className="w-full mt-8"
        size="lg"
        width="full"
        icon={IoMdPlay}
        variant="neutral"
        label="Create Game"
        iconPosition="right"
        iconClassName="ml-2 mt-0.5"
      />
    </div>
  );
}

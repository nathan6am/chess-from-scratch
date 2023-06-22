import { Label, Select } from "../UIKit";
import React, { useCallback, useState, useContext, useMemo } from "react";
import TimeControlSelect from "../UI/TimeControlSelect";
import { Toggle, Button } from "@/components/UIKit";
import { TimeControl } from "@/lib/chess";
import { LobbyOptions } from "@/server/types/lobby";
import { IoMdPlay } from "react-icons/io";
import { MdComputer } from "react-icons/md";
import { SocketContext } from "@/context/socket";
import { useRouter } from "next/router";
import { FaUserFriends, FaRandom } from "react-icons/fa";
import * as Chess from "@/lib/chess";
const RandomIcon = () => {
  return (
    <div
      className="relative h-[1em] w-[1em] rounded-sm"
      style={{
        backgroundImage: "linear-gradient(to bottom right, White 50%, Black 50%)",
      }}
    ></div>
  );
};
export const WhiteIcon = () => {
  return <div className="bg-white h-[1em] w-[1em] rounded-sm"></div>;
};
export const BlackIcon = () => {
  return <div className="bg-black h-[1em] w-[1em] rounded-sm"></div>;
};
const options = [
  {
    icon: FaUserFriends,
    label: "Play vs. Friend",
    value: "friend",
  },
  {
    icon: MdComputer,
    label: "Play vs. Computer",
    value: "computer",
  },
  {
    icon: FaRandom,
    label: "Play vs. Random",
    value: "random",
  },
  {
    icon: IoMdPlay,
    label: "Play Local",
    value: "local",
  },
];

export default function NewGame() {
  const [selected, setSelected] = useState(options[0].value);
  return (
    <div className="flex flex-col w-full h-full items-center p-4 px-6 bg-elevation-2 shadow-lg rounded-lg mb-4">
      <h2 className="text-gold-200 font-bold text-xl">New Game</h2>
      <Select className="w-full max-w-md my-4" options={options} value={selected} onChange={setSelected} />
      <>
        {selected === "friend" && <Friend />}
        {selected === "computer" && <Computer />}
      </>
    </div>
  );
}
const colorOptions = [
  {
    icon: RandomIcon,
    label: "Random color",
    value: "random",
  },
  {
    icon: WhiteIcon,
    label: "White",
    value: "w",
  },
  {
    icon: BlackIcon,
    label: "Black",
    value: "b",
  },
];
function Friend() {
  const router = useRouter();
  const socket = useContext(SocketContext);

  const [rated, setRated] = useState(true);
  const [timeControl, setTimeControl] = useState<TimeControl | undefined>();
  const [color, setColor] = useState<Chess.Color | "random">("random");
  const options = useMemo<LobbyOptions>(() => {
    return {
      color,
      rated,
      gameConfig: {
        timeControl,
      },
    };
  }, [color, rated, timeControl]);
  const createLobby = useCallback(() => {
    console.log(options);
    socket.emit("lobby:create", options, (response) => {
      if (response && response.data) {
        console.log(response.data);
        router.push(`/play/${response.data.id}`);
      }
    });
  }, [socket, router, options]);

  return (
    <div className="w-full max-w-md">
      <Toggle label="Rated" className="my-2 w-fit" checked={rated} onChange={setRated} reverse />
      <TimeControlSelect setTimeControl={setTimeControl} />
      <Label className="mb-2">Play as</Label>
      <Select className="w-full" options={colorOptions} value={color} onChange={setColor} />
      <Button
        onClick={createLobby}
        className="w-full mt-8"
        size="lg"
        icon={IoMdPlay}
        variant="neutral"
        label="Create Game"
        iconPosition="right"
        iconClassName="ml-2 mt-0.5"
      />
    </div>
  );
}

function Computer() {
  const router = useRouter();

  const [timeControl, setTimeControl] = useState<TimeControl | undefined>();
  const [color, setColor] = useState<Chess.Color | "random">("w");
  const [useClock, setUseClock] = useState(false);
  const [level, setLevel] = useState(10);
  const onStart = useCallback(() => {
    router.push(
      `/play/vs-computer/?color=${color}&skillLevel=${level}${
        timeControl ? `&timeControl=${timeControl.timeSeconds / 60}+${timeControl.incrementSeconds}` : ""
      }`
    );
  }, [router, level, timeControl, color]);
  return (
    <div className="w-full max-w-md">
      <Toggle label="Timed?" className="my-2 w-fit" checked={useClock} onChange={setUseClock} reverse />
      <>{useClock && <TimeControlSelect setTimeControl={setTimeControl} />}</>
      <Label className="mb-2">Play as</Label>
      <Select className="w-full" options={colorOptions} value={color} onChange={setColor} />
      <Label className="mb-2 mt-4">Computer Skill Level</Label>
      <Select
        options={[
          { label: "Level 1", value: 1 },
          { label: "Level 2", value: 2 },
          { label: "Level 3", value: 3 },
          { label: "Level 4", value: 4 },
          { label: "Level 5", value: 5 },
          { label: "Level 6", value: 6 },
          { label: "level 7", value: 7 },
          { label: "level 8", value: 8 },
          { label: "level 9", value: 9 },
          { label: "Level 10 (Full strength)", value: 10 },
        ]}
        value={level}
        onChange={setLevel}
      />
      <Button
        onClick={onStart}
        className="w-full mt-8"
        size="lg"
        icon={IoMdPlay}
        variant="neutral"
        label="Start Game"
        iconPosition="right"
        iconClassName="ml-2 mt-0.5"
      />
    </div>
  );
}

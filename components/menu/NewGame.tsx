import { Select } from "../UIKit";
import React, { useState } from "react";
import TimeControlSelect from "../UI/TimeControlSelect";
import { Toggle } from "@/components/UIKit";
import { TimeControl } from "@/lib/chess";
import { LobbyOptions } from "@/server/types/lobby";
const options = [
  {
    label: "Play vs. Friend",
    value: "friend",
  },
  {
    label: "Play vs. Computer",
    value: "computer",
  },
  {
    label: "Play vs. Random",
    value: "random",
  },
  {
    label: "Play Local",
    value: "local",
  },
];
export default function NewGame() {
  const [selected, setSelected] = useState(options[0].value);
  return (
    <div className="flex flex-col w-full h-full items-center p-4 bg-elevation-2 shadow-lg rounded-lg">
      <h2 className="text-gold-200 font-bold text-xl">New Game</h2>
      <Select
        className="w-full max-w-md"
        options={options}
        value={selected}
        onChange={setSelected}
      />
      <Friend />
    </div>
  );
}

function Friend() {
  const [rated, setRated] = useState(true);
  const [timeControl, setTimeControl] = useState<TimeControl | undefined>();
  const [color, setColor] = useState();

  return (
    <div className="w-full">
      <TimeControlSelect setTimeControl={setTimeControl} />
    </div>
  );
}

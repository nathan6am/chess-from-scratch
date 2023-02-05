import React from "react";
import Toggle from "../Menus/content/Toggle";
export default function NewGame() {
  return (
    <div className="flex flex-col p-2 max-w-xl">
      <h2>New game</h2>
      <Toggle label="Rated" onChange={() => {}} />
    </div>
  );
}

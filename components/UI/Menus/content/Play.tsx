import React, { useCallback, useContext, useEffect, useState } from "react";
import { SocketContext } from "@/context/socket";
export default function Play() {
  const socket = useContext(SocketContext);
  const createLobby = useCallback(() => {
    socket.emit("lobby:create", { color: "random" }, (lobby: any) => {
      console.log(lobby);
    });
  }, [socket]);
  const [joinInput, setJoinInput] = useState("");

  return (
    <div className="flex flex-col">
      Play
      <button onClick={createLobby}>Create</button>
      <input
        value={joinInput}
        onChange={(e) => {
          const text = e.target.value;
          setJoinInput(text);
        }}
      ></input>
    </div>
  );
}

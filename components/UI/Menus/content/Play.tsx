import React, { useCallback, useContext, useEffect, useState } from "react";
import { SocketContext } from "@/context/socket";
export default function Play() {
  useEffect(() => {
    const handler = (lobby: any) => {
      console.log(lobby);
    };
    socket.on("lobby:connected", handler);

    return () => {
      socket.off("lobby:connected", handler);
    };
  }, []);
  const socket = useContext(SocketContext);
  const createLobby = useCallback(() => {
    socket.emit("lobby:create", {});
  }, [socket]);
  const [joinInput, setJoinInput] = useState("");

  const joinLobby = useCallback(() => {
    socket.emit("lobby:connect", joinInput);
  }, [socket, joinInput]);

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
      <button onClick={joinLobby}>Join</button>
    </div>
  );
}

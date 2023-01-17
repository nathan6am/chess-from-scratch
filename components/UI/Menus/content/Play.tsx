import React, { useCallback, useContext, useEffect, useState } from "react";
import { SocketContext } from "@/context/socket";
import Button from "../../Button";
export default function Play() {
  const socket = useContext(SocketContext);
  const createLobby = useCallback(() => {
    socket.emit("lobby:create", { color: "random" }, (lobby: any) => {
      console.log(lobby);
    });
  }, [socket]);
  const [joinInput, setJoinInput] = useState("");

  return (
    <div className="flex flex-col items-center">
      <div className="max-w-[800px] w-full p-10 grid md:grid-cols-2 gap-4">
        <Button>
          <p>Play with a Friend</p>
        </Button>
        <Button>
          <p>Play vs. Computer</p>
        </Button>
        <Button>
          <p>Play Local</p>
        </Button>
        <Button>
          <p>Over the board</p>
        </Button>
      </div>
      <div className="w-full grid grid-cols-2 max-w-[800px]">
        <div className="bg-white/[0.2] m-4">
          <h3>Recent Games:</h3>
        </div>
        <div className="bg-white/[0.2] m-4">
          <h3>Active Games:</h3>
        </div>
      </div>
    </div>
  );
}

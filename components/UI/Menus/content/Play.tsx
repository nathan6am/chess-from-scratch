import React, { useCallback, useContext, useEffect, useState } from "react";
import { SocketContext } from "@/context/socket";
import { useRouter } from "next/router";
import Button from "../../Button";
import NewGame from "../../dialogs/NewGame";
export default function Play() {
  const router = useRouter();
  const socket = useContext(SocketContext);

  const createLobby = useCallback(() => {
    socket.emit("lobby:create", { color: "random" }, (response) => {
      if (response && response.data) {
        router.push(`/play/${response.data.id}`);
      }
    });
  }, [socket, router]);
  const [joinInput, setJoinInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="flex flex-col items-center">
      <NewGame
        isOpen={showModal}
        closeModal={() => {
          setShowModal(false);
        }}
        onCreateLobby={createLobby}
      />
      <div className="max-w-[800px] w-full p-10 grid md:grid-cols-2 gap-4">
        <Button
          onClick={() => {
            setShowModal(true);
          }}
        >
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

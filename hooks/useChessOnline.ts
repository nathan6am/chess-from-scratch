import react, { useState, useEffect, useCallback, useContext, useRef } from "react";
import { SocketContext } from "@/context/socket";
import * as Chess from "@/util/chess";
import { io } from "socket.io-client";
export default function useChessOnline(lobbyId: string) {
  const gameSocket = useRef<any>()
  const socket = useContext(SocketContext);
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<any>(null);
  const [game, updateGame] = useState<any>(null);
  const [pending, setPending] = useState<boolean>(true);
  

  useEffect(() => {
    setConnected(false);
    socket.emit(
      "lobby:connect",
      lobbyId,
      (res: { connected: boolean; message?: string; lobby: any }) => {
        if (res && res.connected) {
          setConnected(true);
          setLobby(res.lobby);
        } else if (res && !res.connected) {
          setConnected(false);
          console.error(res.message);
        } else {
          console.error("");
        }
      }
    );

    const onMoveRecieved = (data: unknown) => {
      updateGame(data);
    };
    socket.on("game:move", onMoveRecieved);

    return () => {
      socket.off("game:move", onMoveRecieved);
    };
  }, []);

  const move = useCallback(
    (move: Chess.Move) => {
      if (!lobby) return;
      socket.emit("game:move", lobby.id);
    },
    [socket]
  );

  return connected;
}

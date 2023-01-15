import react, { useState, useEffect, useCallback, useContext, useRef, useMemo } from "react";
import {
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
  LobbySocketData,
  LobbyInterServerEvents,
} from "../server/types/lobby";
import * as Chess from "@/util/chess";
import { io, Socket } from "socket.io-client";
import { Lobby } from "server/types/lobby";
export default function useChessOnline(lobbyId: string) {
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<any>(null);
  const [game, updateGame] = useState<any>(null);
  const [pending, setPending] = useState<boolean>(true);
  const socket = useMemo<
    Socket<LobbyServerToClientEvents<false, false>, LobbyClientToServerEvents<false, true>>
  >(() => {
    return io("/lobby");
  }, []);
  const callbackRef = useRef<(...args: any[]) => void>();
  useEffect(() => {
    if (!socket.connected) socket.connect();
    const onConnect = () => {
      console.log("connected");
      socket.emit("lobby:connect", lobbyId, (res: { status: boolean; data?: Lobby; error: Error | null }) => {
        if (res && res.status) {
          console.log(res.data);
          setLobby(res.data);
        } else if (res && !res.status) {
          setConnected(false);
          console.log(res);
          console.error(res.error?.message);
        } else {
          console.log("why am i here");
        }
      });
      setConnected(true);
    };
    const onConnectError = (err: unknown) => {
      console.log(err);
    };
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    const onMoveRecieved = (data: unknown) => {
      updateGame(data);
    };
    socket.on("game:move", onMoveRecieved);
    const onTest = (response: string, ack: (arg: string) => void) => {
      console.log(response);
      callbackRef.current = ack;
    };
    socket.on("test:requestAck", onTest);

    return () => {
      socket.disconnect();
      socket.off("connect", onConnect);
      socket.off("game:move", onMoveRecieved);
      socket.off("test:requestAck", onTest);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  const test = () => {
    socket.emit("test:timeout");
  };

  const acknowledge = () => {
    const ack = callbackRef.current;
    if (ack) {
      ack("Holy shit");
    }
  };

  return { connected: connected, test: test, acknowledge: acknowledge };
}

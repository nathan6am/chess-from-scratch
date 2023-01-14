import react, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import { SocketContext } from "@/context/socket";
import * as Chess from "@/util/chess";
import { io, Socket } from "socket.io-client";
import { Lobby } from "server/types/lobby";
export default function useChessOnline(lobbyId: string) {
  const gameSocket = useRef<any>();
  const socket = useContext(SocketContext);
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<any>(null);
  const [game, updateGame] = useState<any>(null);
  const [pending, setPending] = useState<boolean>(true);

  const socketRef = useRef<Socket>();
  useEffect(() => {
    setConnected(false);
    socketRef.current = io("/lobby");
    console.log(socketRef.current);
    const socket = socketRef.current;
    socket.emit(
      "lobby:connect",
      lobbyId,
      (res: { status: boolean; data?: Lobby; error: Error | null }) => {
        if (res && res.status) {
          setConnected(true);
          setLobby(res.data);
        } else if (res && !res.status) {
          setConnected(false);
          console.log(res);
          console.error(res.error?.message);
        } else {
          console.error("WTF");
        }
      }
    );

    const onMoveRecieved = (data: unknown) => {
      updateGame(data);
    };
    socket.on("game:move", onMoveRecieved);

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
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

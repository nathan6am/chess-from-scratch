import react, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  useMemo,
} from "react";
import {
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
  LobbySocketData,
  LobbyInterServerEvents,
  Game,
  Clock,
} from "../server/types/lobby";
import * as Chess from "@/util/chess";
import { UserContext } from "@/context/user";
import { io, Socket } from "socket.io-client";
import { Lobby } from "server/types/lobby";
import _ from "lodash";
import useTimer from "./useTimer";
import { DateTime } from "luxon";

export default function useChessOnline(lobbyId: string) {
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const lobbyid = lobby?.id || null;
  const [game, updateGame] = useState<Game | null>(null);
  const user = useContext(UserContext);
  const gameActive = useMemo(() => {
    return game !== null;
  }, [game]);
  const playerColor = useMemo<Chess.Color | null>(() => {
    if (game === null) return null;
    if (!user) return null;
    if (game.players.w === user?.id) return "w";
    if (game.players.b === user?.id) return "b";
    return null;
  }, [game, user]);
  const clockRef = useRef<{
    w: number;
    b: number;
  } | null>(null);
  const clock = useMemo(() => {
    if (!game) return null;
    return {
      ...game.clock.timeRemainingMs,
    };
  }, [game]);
  const delayRef = useRef<DateTime>();
  const activeColor = useMemo(() => game?.data.activeColor, [game]);
  const timerWhite = useTimer(0, { autoStart: false, resolution: "cs" });
  const timerBlack = useTimer(0, { autoStart: false, resolution: "cs" });
  useEffect(() => {
    if (_.isEqual(clockRef.current, clock)) return;
    clockRef.current = clock;
    if (!clock) return;
    timerWhite.restart(clock.w, activeColor === "w");
    timerBlack.restart(clock.b, activeColor === "b");
  }, [clock, clockRef, timerBlack, timerWhite]);

  const socket = useMemo<
    Socket<
      LobbyServerToClientEvents<false, false>,
      LobbyClientToServerEvents<false, true>
    >
  >(() => {
    return io("/lobby");
  }, []);
  const callbackRef = useRef<(...args: any[]) => void>();
  useEffect(() => {
    if (!socket.connected) socket.connect();
    const onConnect = () => {
      socket.emit(
        "lobby:connect",
        lobbyId,
        (res: { status: boolean; data?: Lobby; error: Error | null }) => {
          if (res && res.status && res.data) {
            const lobby = res.data;
            setLobby(res.data);
            if (lobby.currentGame) {
              updateGame(lobby.currentGame);
            }
          } else if (res && !res.status) {
            setConnected(false);
            console.log(res);
            console.error(res.error?.message);
          } else {
          }
        }
      );
      setConnected(true);
    };
    const onConnectError = (err: unknown) => {
      console.log(err);
    };
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    const onMoveRecieved = (game: Game) => {
      updateGame(game);
    };
    socket.on("game:new", (game) => {
      updateGame(game);
    });
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

  const onMove = useCallback(
    (move: Chess.Move) => {
      if (!game || !playerColor || !lobbyid) return;
      if (game.data.activeColor !== playerColor) return;
      if (
        game.data.legalMoves.some((legalMove) => _.isEqual(move, legalMove))
      ) {
        delayRef.current = DateTime.now();
        updateGame((current) => {
          if (!current) return current;
          const newData = Chess.move(current.data, move);
          return { ...current, data: newData };
        });
        if (playerColor === "w") {
          timerWhite.pause;
        } else {
          timerWhite.pause;
        }
        socket.emit("game:move", { move, lobbyid }, (response) => {
          if (response.status && response.data) {
            if (delayRef.current) {
              console.log(DateTime.now().diff(delayRef.current).toMillis());
            }
            updateGame(response.data);
          }
        });
      }
    },
    [socket, game, playerColor, lobbyid, delayRef]
  );
  const acknowledge = () => {
    const ack = callbackRef.current;
    if (ack) {
      ack("Holy shit");
    }
  };

  return {
    connected: connected,
    test: test,
    acknowledge: acknowledge,
    game,
    gameActive,
    playerColor,
    onMove,
    timeRemaining: {
      w: timerWhite.timeRemaining,
      b: timerBlack.timeRemaining,
    },
  };
}

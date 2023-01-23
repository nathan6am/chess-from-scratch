import react, { useState, useEffect, useCallback, useContext, useRef, useMemo } from "react";
import {
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
  LobbySocketData,
  LobbyInterServerEvents,
  Game,
  Clock,
} from "../server/types/lobby";
import * as Chess from "@/lib/chess";
import { UserContext } from "@/context/user";
import { io, Socket } from "socket.io-client";
import { Lobby } from "server/types/lobby";
import _ from "lodash";
import useTimer from "./useTimer";
import { DateTime } from "luxon";
import { notEmpty } from "@/util/misc";

export default function useChessOnline(lobbyId: string) {
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const lobbyid = lobby?.id || null;
  const [game, updateGame] = useState<Game | null>(null);
  const { user } = useContext(UserContext);
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

  const moveHistoryFlat = useMemo(() => {
    if (!game) return [];
    return game.data.moveHistory.flat().filter(notEmpty);
  }, [game?.data]);

  const [livePositionOffset, setLivePositionOffset] = useState(0);

  const initialBoard = useMemo(() => {
    if (!game) return null;
    const fen = game.data.config.startPosition;
    const position = Chess.fenToGameState(fen);
    if (!position) return null;
    return Chess.positionToBoard(position.position);
  }, [game]);

  //Board to display based on the liveBoardIdx, enables support for cycling through moves during a game
  const currentBoard = useMemo(() => {
    if (!game) return null;
    if (livePositionOffset === 0) return game.data.board;
    if (livePositionOffset + 1 > moveHistoryFlat.length) {
      return initialBoard;
    }
    return moveHistoryFlat[moveHistoryFlat.length - (livePositionOffset + 1)].board || null;
  }, [livePositionOffset, moveHistoryFlat, game]);

  const lastMove = useMemo(() => {
    if (!game) return null;
    if (livePositionOffset === 0) return game.data.lastMove;
    if (livePositionOffset + 1 > moveHistoryFlat.length) {
      return null;
    }
    return moveHistoryFlat[moveHistoryFlat.length - (livePositionOffset + 1)].move || null;
  }, [livePositionOffset, moveHistoryFlat, game]);

  const moveable = useMemo<boolean>(() => {
    if (!game) return false;
    if (livePositionOffset !== 0) return false;
    return true;
  }, [livePositionOffset, game]);

  //Callbacks to control the live board position

  const stepForward = useCallback(() => {
    setLivePositionOffset((cur) => (cur > 0 ? cur - 1 : cur));
  }, [moveHistoryFlat]);

  const stepBackward = useCallback(() => {
    setLivePositionOffset((cur) => (cur < moveHistoryFlat.length ? cur + 1 : cur));
  }, [moveHistoryFlat]);

  const jumpForward = () => {
    setLivePositionOffset(0);
  };
  const jumpBackward = useCallback(() => {
    setLivePositionOffset(moveHistoryFlat.length);
  }, [moveHistoryFlat]);

  const jumpToOffset = useCallback(
    (offset: number) => {
      if (offset >= 0 && offset < moveHistoryFlat.length) {
        setLivePositionOffset(offset);
      }
    },
    [moveHistoryFlat]
  );

  //Track the last updated clock state - used to track last known clock state to
  //prevent useEffect from updating timers if the game is updated but the clock state hasn't changed
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

  const started = useMemo<boolean>(() => {
    if (!game) return false;
    return game.data.fullMoveCount >= 2;
  }, [game]);

  //Track the current server delay
  const delayRef = useRef<DateTime>();

  const activeColor = useMemo(() => game?.data.activeColor, [game]);
  //Move timer hooks
  const timerWhite = useTimer(0, { autoStart: false, resolution: "cs" });
  const timerBlack = useTimer(0, { autoStart: false, resolution: "cs" });

  //Update and swap (if necessary) the clocks when the clock state is updated from the server
  useEffect(() => {
    if (_.isEqual(clockRef.current, clock)) return;
    clockRef.current = clock;
    if (!clock) return;
    timerWhite.restart(clock.w, started && activeColor === "w");
    timerBlack.restart(clock.b, started && activeColor === "b");
  }, [clock, clockRef, timerBlack, timerWhite]);

  //Memoized socket connection
  const socket = useMemo<
    Socket<LobbyServerToClientEvents<false, false>, LobbyClientToServerEvents<false, true>>
  >(() => {
    return io("/lobby");
  }, []);

  //Used to store a callback recieved from a socket event; this way an acknowledgement can be sent to the
  //server in response to a user event
  const callbackRef = useRef<(...args: any[]) => void>();

  //Register Event Listeners and auto-connect to the lobby on mount
  useEffect(() => {
    if (!socket.connected) socket.connect();
    const onConnect = () => {
      socket.emit("lobby:connect", lobbyId, (res: { status: boolean; data?: Lobby; error: Error | null }) => {
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
      });
      setConnected(true);
    };
    const onConnectError = (err: unknown) => {
      console.log(err);
    };
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    const onMoveRecieved = (game: Game) => {
      setLivePositionOffset(0);
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

    const onMoveRequested = (timeout: number, game: Game, ack: (move: Chess.Move) => void) => {
      callbackRef.current = ack;
      updateGame(game);
    };
    socket.on("game:request-move", onMoveRequested);
    socket.on("test:requestAck", onTest);

    return () => {
      socket.disconnect();
      socket.off("connect", onConnect);
      socket.off("game:move", onMoveRecieved);
      socket.off("test:requestAck", onTest);
      socket.off("game:request-move", onMoveRequested);
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
      if (game.data.legalMoves.some((legalMove) => _.isEqual(move, legalMove))) {
        delayRef.current = DateTime.now();
        //Optimistically update the game state for smooth animations
        setLivePositionOffset(0);
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
        if (callbackRef.current) {
          callbackRef.current(move);
        } else {
          //Emit the move event to the server and update the game again upon acknowledgement
          socket.emit("game:move", { move, lobbyid }, (response) => {
            if (response.status && response.data) {
              if (delayRef.current) {
                console.log(DateTime.now().diff(delayRef.current).toMillis());
              }
              updateGame(response.data);
            }
            //TODO: Error handling on server error response
          });
        }
      }
    },
    [socket, game, playerColor, lobbyid, delayRef]
  );

  return {
    connected: connected,
    test: test,
    game,
    currentBoard,
    livePositionOffset,
    moveable,
    controls: {
      stepBackward,
      stepForward,
      jumpBackward,
      jumpForward,
      jumpToOffset,
    },
    gameActive,
    lastMove,
    playerColor,
    onMove,
    timeRemaining: {
      w: timerWhite.timeRemaining,
      b: timerBlack.timeRemaining,
    },
  };
}

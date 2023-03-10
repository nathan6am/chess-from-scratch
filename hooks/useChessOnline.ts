//Framework
import { useState, useEffect, useCallback, useContext, useRef, useMemo } from "react";

//Types
import { LobbyClientToServerEvents, LobbyServerToClientEvents, Game, Connection } from "../server/types/lobby";
import { Lobby, Player } from "server/types/lobby";

//Util
import * as Chess from "@/lib/chess";
import { DateTime, DurationObjectUnits } from "luxon";
import { notEmpty } from "@/util/misc";
import _ from "lodash";
import useTimer from "./useTimer";
import useSound from "use-sound";
//Context
import { UserContext } from "@/context/user";
import { io, Socket } from "socket.io-client";

export interface BoardControls {
  jumpForward: () => void;
  jumpBackward: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToOffset: (offset: number) => void;
}

export interface GameControls {
  resign: () => void;
  offerDraw?: () => void;
  acceptDraw?: () => void;
  onMove: (move: Chess.Move) => void;
  onPremove?: (move: Chess.Move) => void;
}

export interface OnlineGame {
  connectionStatus: {
    socket: boolean;
    lobby: boolean;
  };
  lobby: Lobby | null;
  currentGame: Game | null;
  players: Connection[];
  playerColor: Chess.Color;
  premoveQueue: Chess.Move[];
  currentBoard: Chess.Board | null;
  livePositionOffset: number;
  boardControls: BoardControls;
  gameControls: GameControls;
  lastMove: Chess.Move | null;
  timeRemaining: Record<Chess.Color, DurationObjectUnits>;
  moveable: boolean;
}

export default function useChessOnline(lobbyId: string): OnlineGame {
  const [socketConnected, setSocketConnected] = useState(false); //Socket connection status
  const [lobby, setLobby] = useState<Lobby | null>(null); //Current lobby data
  const lobbyid = lobby?.id || null; //ID of the connected lobby
  const [game, updateGame] = useState<Game | null>(null); //The current active game
  const [premoveQueue, setPremoveQueue] = useState<Chess.Move[]>([]);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const { user } = useContext(UserContext);
  const lobbyConnected = lobby !== null;
  const gameActive = useMemo(() => {
    return game !== null;
  }, [game]);

  const playerColor = useMemo<Chess.Color | null>(() => {
    if (game === null) return null;
    if (!user) return null;
    if (game.players.w.id === user?.id) return "w";
    if (game.players.b.id === user?.id) return "b";
    return null;
  }, [game, user]);

  const players = lobby?.connections;

  //Flattened move history
  const moveHistoryFlat = useMemo(() => {
    if (!game) return [];
    return game.data.moveHistory.flat().filter(notEmpty);
  }, [game?.data]);

  //Start position of the current game
  const initialBoard = useMemo(() => {
    if (!game) return null;
    const fen = game.data.config.startPosition;
    const position = Chess.fenToGameState(fen);
    if (!position) return null;
    return Chess.positionToBoard(position.position);
  }, [game]);

  //Offset from the live position to display on the board
  const [livePositionOffset, setLivePositionOffset] = useState(0);

  //Board to display based on the liveBoardIdx, enables cycling through past moves during a game
  const currentBoard = useMemo(() => {
    if (!game) return null;
    if (livePositionOffset === 0) return game.data.board;
    if (livePositionOffset + 1 > moveHistoryFlat.length) {
      return initialBoard;
    }
    return moveHistoryFlat[moveHistoryFlat.length - (livePositionOffset + 1)].board || null;
  }, [livePositionOffset, moveHistoryFlat, game]);

  //Memoized last move played in the current game
  const lastMove = useMemo(() => {
    if (!game) return null;
    if (livePositionOffset === 0) return game.data.lastMove;
    if (livePositionOffset + 1 > moveHistoryFlat.length) {
      return null;
    }
    return moveHistoryFlat[moveHistoryFlat.length - (livePositionOffset + 1)].move || null;
  }, [livePositionOffset, moveHistoryFlat, game]);

  //Move sounds
  const [playMove] = useSound("/assets/sounds/move.wav");
  const [playCapture] = useSound("/assets/sounds/capture.wav");
  const [playCastle] = useSound("/assets/sounds/castle.wav");
  const lastMoveRef = useRef<Chess.Move | null>(null);
  useEffect(() => {
    if (_.isEqual(lastMoveRef.current, lastMove)) return;
    lastMoveRef.current = lastMove;
    if (lastMove) {
      if (lastMove.capture) playCapture();
      else if (lastMove.isCastle) playCastle();
      else playMove();
    }
  }, [lastMove, playMove, playCapture, playCastle, lastMoveRef]);

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
    activeColor: Chess.Color;
  } | null>(null);

  const clock = useMemo(() => {
    if (!game) return null;
    return {
      ...game.clock.timeRemainingMs,
      activeColor: game.data.activeColor,
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
  }, [clock, clockRef, timerBlack, timerWhite, started]);

  useEffect(() => {
    if (game?.data.outcome) {
      timerWhite.pause();
      timerBlack.pause();
    }
  }, [game?.data.outcome, timerBlack, timerWhite]);
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

    //Define event handlers
    const onConnect = () => {
      socket.emit("lobby:connect", lobbyId, (res: { status: boolean; data?: Lobby; error: Error | null }) => {
        if (res && res.status && res.data) {
          const lobby = res.data;
          setLobby(res.data);
          if (lobby.currentGame) {
            updateGame(lobby.currentGame);
          }
        } else if (res && !res.status) {
          setSocketConnected(false);
          console.log(res);
          console.error(res.error?.message);
        } else {
        }
      });
      setSocketConnected(true);
    };
    const onLobbyDidUpdate = (updates: Partial<Lobby>) => {
      setLobby((current) => {
        if (!current) return current;
        return { ...current, ...updates };
      });
    };
    const onConnectError = (err: unknown) => {
      setConnectionError(true);
    };
    const onMoveRecieved = (game: Game) => {
      setLivePositionOffset(0);
      updateGame(game);
    };
    const onNewGame = (game: Game) => {
      updateGame(game);
    };
    const onTest = (response: string, ack: (arg: string) => void) => {
      callbackRef.current = ack;
    };
    const onMoveRequested = (timeout: number, game: Game, ack: (move: Chess.Move) => void) => {
      callbackRef.current = ack;
      updateGame(game);
    };
    const onOutcome = (game: Game) => {
      updateGame(game);
    };
    //Register event listeners
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("lobby:update", onLobbyDidUpdate);
    socket.on("game:new", onNewGame);
    socket.on("game:move", onMoveRecieved);
    socket.on("game:outcome", onOutcome);
    socket.on("game:request-move", onMoveRequested);
    socket.on("test:requestAck", onTest);

    return () => {
      socket.disconnect();
      socket.off("connect", onConnect);
      socket.off("game:move", onMoveRecieved);
      socket.off("game:new", onNewGame);
      socket.off("test:requestAck", onTest);
      socket.off("game:request-move", onMoveRequested);
      socket.off("game:outcome", onOutcome);
      socket.off("connect_error", onConnectError);
      socket.off("lobby:update", onLobbyDidUpdate);
    };
  }, []);

  const onMove = useCallback(
    (move: Chess.Move) => {
      if (!game || !playerColor || !lobbyid) return;
      if (game.data.activeColor !== playerColor) return;
      if (game.data.outcome) return;
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
          callbackRef.current = undefined;
          socket.emit("game:update", lobbyid, (response) => {
            if (response.status && response.data) {
              updateGame((current) => {
                if (!current) return current;
                return {
                  ...current,
                  data: response.data?.data || current?.data,
                };
              });
            } else {
              setConnectionError(true);
            }
          });
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

  const prevGame = useRef<Chess.Game>();
  useEffect(() => {
    if (!game) return;
    if (_.isEqual(prevGame.current, game)) return;
    if (!playerColor) return;
    if (game.data.activeColor !== playerColor) return;
    if (!premoveQueue.length) return;
    const nextPremove = premoveQueue[0];
    const move = game.data.legalMoves.find(
      (move) =>
        move.start === nextPremove.start &&
        move.end === nextPremove.end &&
        (!move.promotion || move.promotion === nextPremove.promotion)
    );
    if (!move) setPremoveQueue([]);
    else onMove(move);
    prevGame.current = game.data;
    setPremoveQueue((cur) => cur.slice(1));
  }, [onMove, game, premoveQueue, playerColor]);

  const resign = useCallback(() => {
    if (!lobbyid) return;
    socket.emit("game:resign", lobbyid);
  }, [socket, lobbyid]);

  return {
    connectionStatus: {
      socket: socketConnected,
      lobby: lobbyConnected,
    },
    lobby,
    premoveQueue,
    currentGame: game,
    currentBoard,
    livePositionOffset,
    moveable,
    boardControls: {
      stepBackward,
      stepForward,
      jumpBackward,
      jumpForward,
      jumpToOffset,
    },
    gameControls: {
      onMove,
      resign,
    },
    lastMove,
    playerColor: playerColor || "w",
    players: players || [],
    timeRemaining: {
      w: timerWhite.timeRemaining,
      b: timerBlack.timeRemaining,
    },
  };
}

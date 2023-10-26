//Framework
import { useState, useEffect, useCallback, useContext, useRef, useMemo } from "react";

//Types
import {
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
  Game,
  Connection,
  ChatMessage,
} from "../server/types/lobby";
import { Lobby, Player } from "server/types/lobby";

//Util
import * as Chess from "@/lib/chess";
import { DateTime, DurationObjectUnits } from "luxon";
import { notEmpty } from "@/util/misc";
import _ from "lodash";
import useTimer from "./useTimer";
import useSound from "use-sound";
import useOpeningExplorer from "./useOpeningExplorer";
//Context
import { UserContext } from "@/context/user";
import { io, Socket } from "socket.io-client";
import { SettingsContext } from "@/context/settings";

export interface BoardControls {
  jumpForward: () => void;
  jumpBackward: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToOffset: (offset: number) => void;
}

export interface GameControls {
  resign: () => void;
  offerDraw: () => void;
  acceptDraw: (accepted: boolean) => void;
  requestRematch: () => void;
  acceptRematch: (accepted: boolean) => void;
  onMove: (move: Chess.Move) => void;
  onPremove?: (move: Chess.Premove) => void;
  clearPremoveQueue?: () => void;
}

export interface OnlineGame {
  connectionStatus: {
    socket: boolean;
    lobby: boolean;
  };
  lobby: Lobby | null;
  currentGame: Game | null;
  opening: {
    eco: string;
    name: string;
  } | null;
  gameStatus: "waiting" | "active" | "complete";
  players: Connection[];
  playerColor: Chess.Color;
  premoveQueue: Chess.Premove[];
  currentBoard: Chess.Board | null;
  livePositionOffset: number;
  boardControls: BoardControls;
  gameControls: GameControls;
  lastMove: Chess.Move | null;
  availablePremoves: Chess.Premove[];
  timeRemaining: Record<Chess.Color, DurationObjectUnits>;
  rematchOffer: "recieved" | "offered" | "declined" | null;
  drawOfferRecieved: boolean;
  drawOfferSent: boolean;
  moveable: boolean;
  chat: ChatMessage[];
  sendMessage: (message: string) => void;
}

export default function useChessOnline(lobbyId: string): OnlineGame {
  const { settings } = useContext(SettingsContext);
  const [socketConnected, setSocketConnected] = useState(false); //Socket connection status
  const [lobby, setLobby] = useState<Lobby | null>(null); //Current lobby data
  const lobbyid = lobby?.id || null; //ID of the connected lobby
  const [game, updateGame] = useState<Game | null>(null); //The current active game
  const [premoveQueue, setPremoveQueue] = useState<Chess.Premove[]>([]);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const { user } = useContext(UserContext);
  const chat = lobby?.chat;
  const currentGame = useMemo(() => {
    return game?.data || Chess.createGame({});
  }, [game?.data]);
  const explorer = useOpeningExplorer(currentGame);
  const { data, sourceGame } = explorer;

  const startPositionOpening = useMemo(() => {
    if (sourceGame.config.startPosition === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
      return "Start Position";
    else return "Custom Position";
  }, [sourceGame.config.startPosition]);
  const prevOpening = useRef<{ name: string; eco: string } | null>({ name: startPositionOpening, eco: "" });
  useEffect(() => {
    if (!data) return;
    if (data.opening && !_.isEqual(data.opening, prevOpening)) {
      prevOpening.current = data.opening;
    }
  }, [data]);
  const opening = useMemo(() => {
    return data?.opening || prevOpening.current;
  }, [data]);

  const lobbyConnected = lobby !== null;
  const gameStatus = useMemo(() => {
    if (!game) return "waiting";
    if (game?.data.fullMoveCount < 2) return "waiting";
    if (game?.data.outcome) return "complete";
    return "active";
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

  //Premoves
  const availablePremoves = useMemo(() => {
    if (!game) return [];
    return Chess.getPremoves(game.data);
  }, [game?.data]);

  const onPremove = (premove: Chess.Premove) => {
    if (availablePremoves.some((availablePremove) => _.isEqual(premove, availablePremove))) {
      playPremove();
      setPremoveQueue([premove]);
    }
  };
  const clearPremoveQueue = () => {
    setPremoveQueue([]);
  };
  //Move sounds
  const moveVolume = useMemo(() => {
    if (!settings.sound.moveSounds) return 0;
    return settings.sound.volume / 100;
  }, [settings.sound.volume, settings.sound.moveSounds]);
  const [playMove] = useSound("/assets/sounds/move.wav", {
    volume: moveVolume,
  });
  const [playCapture] = useSound("/assets/sounds/capture.wav", {
    volume: moveVolume,
  });
  const [playCastle] = useSound("/assets/sounds/castle.wav", {
    volume: moveVolume,
  });
  const [playPremove] = useSound("/assets/sounds/premove.wav", {
    volume: moveVolume,
  });
  const [playMessage] = useSound("/assets/sounds/message.wav", {
    volume: settings.sound.notifcationSounds ? settings.sound.volume / 100 : 0,
  });

  const lastMessage = useMemo(() => {
    if (!chat) return null;
    return chat[chat.length - 1];
  }, [chat]);

  useEffect(() => {
    if (!lastMessage) return;
    if (!user?.id) return;
    if (lastMessage.author.id === user?.id) return;
    playMessage();
  }, [lastMessage, playMessage, user?.id]);

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

  const requestUpdate = () => {
    if (lobbyid) {
      socket.emit("lobby:connect", lobbyid, (response) => {
        const lobby = response.data;
        if (lobby) {
          setLobby(lobby);
          if (lobby.currentGame) {
            updateGame(lobby.currentGame);
          }
        }
      });
    }
  };

  const sendMessage = (message: string) => {
    socket.emit("lobby:chat", { message, lobbyid: lobbyid || "" }, (response) => {
      if (response.data) {
        setLobby((current) => {
          if (!current) return current;
          if (!response.data) return current;
          return { ...current, chat: response.data };
        });
      }
    });
  };

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
    const onDisconnect = () => {
      console.log("Disconnected from lobby");
      setSocketConnected(false);
      callbackRef.current = undefined;
    };
    const onLobbyDidUpdate = (updates: Partial<Lobby>) => {
      setLobby((current) => {
        if (!current) return current;
        return { ...current, ...updates };
      });
    };
    const onConnectError = (err: unknown) => {
      console.log("Disconnected from lobby");
      setSocketConnected(false);
      callbackRef.current = undefined;
      setConnectionError(true);
    };

    const onDrawOffered = (offeredBy: Chess.Color) => {
      updateGame((current) => {
        if (!current) return current;
        return {
          ...current,
          drawOffered: offeredBy,
        };
      });
    };
    const onDrawDeclined = () => {
      console.log("draw declined");
      updateGame((current) => {
        if (!current) return current;
        return {
          ...current,
          drawOffered: undefined,
        };
      });
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
    const onOutcome = (game: Game, ratingDeltas?: Record<Chess.Color, number>) => {
      updateGame(game);
    };
    const onChat = (chat: ChatMessage[]) => {
      setLobby((lobby) =>
        lobby
          ? {
              ...lobby,
              chat,
            }
          : lobby
      );
    };
    const onRematchRequested = (rematchOffers: Record<Chess.Color, boolean | null>) => {
      setLobby((current) => {
        if (!current) return current;
        return {
          ...current,
          rematchRequested: rematchOffers,
        };
      });
    };
    //Register event listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("lobby:update", onLobbyDidUpdate);
    socket.on("game:new", onNewGame);
    socket.on("game:move", onMoveRecieved);
    socket.on("game:outcome", onOutcome);
    socket.on("game:request-move", onMoveRequested);
    socket.on("game:draw-offered", onDrawOffered);
    socket.on("game:draw-declined", onDrawDeclined);
    socket.on("test:requestAck", onTest);
    socket.on("lobby:chat", onChat);
    socket.on("lobby:rematch-requested", onRematchRequested);
    socket.on("lobby:rematch-declined", onRematchRequested);

    return () => {
      socket.disconnect();
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("game:move", onMoveRecieved);
      socket.off("game:new", onNewGame);
      socket.off("test:requestAck", onTest);
      socket.off("game:request-move", onMoveRequested);
      socket.off("game:draw-offered", onDrawOffered);
      socket.off("game:draw-declined", onDrawDeclined);
      socket.off("game:outcome", onOutcome);
      socket.off("connect_error", onConnectError);
      socket.off("lobby:update", onLobbyDidUpdate);
      socket.off("lobby:chat", onChat);
      socket.off("lobby:rematch-requested", onRematchRequested);
      socket.off("lobby:rematch-declined", onRematchRequested);
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
              requestUpdate();
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
    [socket, game, playerColor, lobbyid, delayRef, requestUpdate]
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

  const offerDraw = useCallback(() => {
    if (!lobbyid) return;
    socket.emit("game:offer-draw", lobbyid);
  }, [socket, lobbyid, playerColor]);

  const acceptDraw = useCallback(
    (accept: boolean) => {
      if (!lobbyid) return;
      socket.emit("game:accept-draw", lobbyid, accept);
    },
    [socket, lobbyid]
  );

  const rematchOffer = useMemo(() => {
    if (!lobby) return null;
    if (!lobby.rematchRequested) return null;
    if (!playerColor) return null;
    const opponentColor = playerColor === "w" ? "b" : "w";
    if (lobby.rematchRequested[opponentColor] === true) return "recieved";
    if (lobby.rematchRequested[playerColor] === true && lobby.rematchRequested[opponentColor] === null)
      return "offered";
    if (lobby.rematchRequested[opponentColor] === false) return "declined";
    return null;
  }, [lobby?.rematchRequested, playerColor, game?.data.outcome]);

  const requestRematch = useCallback(() => {
    if (!lobbyid) return;
    socket.emit("lobby:request-rematch", lobbyid, (offers) => {
      if (!offers.status || !offers.data) return;
      console.log(offers);
      setLobby((current) => {
        if (!current) return current;
        return {
          ...current,
          rematchRequested: offers.data || current.rematchRequested,
        };
      });
    });
  }, [socket, lobbyid]);

  const acceptRematch = useCallback(
    (accept: boolean) => {
      if (!lobbyid) return;
      if (rematchOffer !== "recieved") return;
      socket.emit("lobby:accept-rematch", lobbyid, accept, (offers) => {
        if (!offers.status || !offers.data) return;
        setLobby((current) => {
          if (!current) return current;
          return {
            ...current,
            rematchRequested: offers.data || current.rematchRequested,
          };
        });
      });
    },
    [socket, lobbyid]
  );

  const drawOfferRecieved = useMemo(() => {
    if (!game) return false;
    if (game.data.outcome) return false;
    if (game.drawOffered === playerColor || !game.drawOffered) return false;
    return true;
  }, [game, playerColor, game?.drawOffered]);

  const drawOfferSent = useMemo(() => {
    if (!game) return false;
    if (game.data.outcome) return false;
    if (game.drawOffered !== playerColor) return false;
    return true;
  }, [game, playerColor, game?.drawOffered]);

  return {
    connectionStatus: {
      socket: socketConnected,
      lobby: lobbyConnected,
    },
    chat: chat || [],
    sendMessage,
    lobby,
    availablePremoves,
    premoveQueue,
    currentGame: game,
    opening,
    gameStatus,
    currentBoard,
    livePositionOffset,
    moveable,
    rematchOffer,
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
      onPremove,
      clearPremoveQueue,
      offerDraw,
      acceptDraw,
      requestRematch,
      acceptRematch,
    },
    drawOfferRecieved,
    drawOfferSent,

    lastMove,
    playerColor: playerColor || "w",
    players: players || [],
    timeRemaining: {
      w: timerWhite.timeRemaining,
      b: timerBlack.timeRemaining,
    },
  };
}

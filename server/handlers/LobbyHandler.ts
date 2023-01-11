import { nanoid } from "nanoid";

import * as socketio from "socket.io";
import redisClient from "../redis/sessionClient";
import * as Chess from "../../util/chess";
import { DateTime } from "luxon";
import { callbackify } from "util";

interface Game {
  id: string;
  gameData: Chess.Game;
  lastMoveTime?: string;
  timeRemainingMs?: Record<Chess.Color, number>;
  playerIDs?: Record<Chess.Color, string>;
}

interface Lobby {
  id: string;
  connections: Array<{ player: Player; score: number }>;
  currentGame: Game;
  options: Chess.GameConfig;
}

interface Player {
  id: string;
  activeSocket: string;
}
export default function (io: socketio.Server, socket: socketio.Socket): void {
  socket.on("lobby:create", async (options, callback) => {
    const id = nanoid(10);
    const uid = socket.userID;
    if (!uid) return;
    const gameJSON = Chess.createGame() as any;
    const player: Player = {
      id: uid,
      activeSocket: socket.id,
    };
    const connection = {
      player,
      score: 0,
    };
    const lobby: Lobby = {
      id,
      connections: [connection],
      currentGame: {
        id: nanoid(),
        gameData: gameJSON,
      },
      options: options,
    };
    await redisClient.json.set(id, "$", lobby as any);
    console.log(id);
  });

  socket.on("lobby:connect", async (lobbyId, callback) => {
    const uid = socket.userID;
    if (!uid) {
      callback({
        connected: false,
        message: "Unauthenticated",
      });
      return;
    }
    //console.log("getting lobby");
    const lobby = await getLobbyById(lobbyId);
    if (!lobby) {
      callback({
        connected: false,
        message: "Lobby does not exist",
      });
      return;
    }
    console.log(lobby.connections);
    console.log(uid);
    const existingConnection = lobby.connections.find((conn) => conn.player.id === uid);
    if (existingConnection) {
      const { player } = existingConnection;
      if (player.activeSocket !== socket.id) {
        ///change the active socket
      }
      callback({
        connected: true,
        lobby: lobby,
      });
    } else if (lobby.connections.length < 2) {
      console.log("i am here");
      const player: Player = {
        id: uid,
        activeSocket: socket.id,
      };
      const connection = {
        player,
        score: 0,
      };
      lobby.connections.push(connection);
      console.log(lobby.connections);
      const updated = await updateLobby(lobbyId, lobby);

      if (updated) {
        socket.join(lobbyId);
        callback({
          connected: true,
          lobby: lobby,
        });
      }
    } else {
      callback({
        connected: false,
        message: "Lobby full",
      });
    }
  });

  socket.on("game:move", async (lobbyid: string, move: Chess.Move) => {
    const timeRecieved = DateTime.now();
    const lagComp = 20;
    const uid = socket.userID;

    if (!uid) return;
    //todo unauthenticated emit
    const lobby = await getLobbyById(lobbyid);
    if (!lobby) return;

    //Make sure the player is listed as a connection to the lobby
    const authenticated = lobby.connections.find((conn) => conn.player.id === uid);
    if (!authenticated) return;

    if (socket.id !== authenticated.player.activeSocket) {
      //TODO, update the activeSocket and emit to other connections
      return;
    }
    const game = lobby.currentGame;
    if (!game.playerIDs || !game.timeRemainingMs || !game.lastMoveTime) return;
    //TODO: ID of the player does not match the turn color of the game
    if (game.playerIDs[game.gameData.activeColor] !== uid) {
      return;
    }

    const updatedGame = Chess.move(game.gameData, move);
    const lastMoveTime = DateTime.fromISO(game.lastMoveTime);

    const timeElapsed = timeRecieved.diff(lastMoveTime).milliseconds;

    let updatedTimeRemainingMs = {
      ...game.timeRemainingMs,
    };

    const activeColorTimeRemaining = updatedTimeRemainingMs[game.gameData.activeColor] - timeElapsed + lagComp;
    if (activeColorTimeRemaining <= 0) {
      //GAME OVER -TIMEOUT
      return;
    }
    updatedTimeRemainingMs[game.gameData.activeColor] = activeColorTimeRemaining;

    const newGame: Game = {
      ...game,
      timeRemainingMs: updatedTimeRemainingMs,
      lastMoveTime: DateTime.now().toISO(),
      gameData: updatedGame,
    };

    const updated = await updateLobby(lobbyid, { currentGame: newGame });
    if (updated) io.to(lobbyid).emit("game:move", newGame);
  });
}

async function getLobbyById(id: string): Promise<Lobby | undefined> {
  const lobby: unknown = await redisClient.json.get(id);
  if (lobby) {
    return lobby as Lobby;
  }
  return undefined;
}

async function updateLobby(id: string, updates: Partial<Lobby>): Promise<Lobby | undefined> {
  const lobby = await getLobbyById(id);
  if (!lobby) return undefined;
  const updatedLobby = { ...lobby, ...updates };

  const updated = await redisClient.json.set(id, "$", updatedLobby as any);
  if (updated) {
    return updatedLobby;
  } else {
    return undefined;
  }
}

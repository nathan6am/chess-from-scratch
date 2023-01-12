import { nanoid } from "nanoid";

import * as socketio from "socket.io";
import redisClient from "../redis/sessionClient";
import * as Chess from "../../util/chess";
import { DateTime } from "luxon";
import { Server, Socket } from "../@types/socket";

import { Lobby, Game, Player } from "../@types/lobby";

export default function (io: Server, socket: Socket): void {
  socket.on("lobby:create", async (options, ack) => {
    const id = nanoid(10);
    const uid = socket.data.userid;
    if (!uid) return;
    const game = Chess.createGame() as any;
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
        data: game,
      },
      options: options,
    };
    const created = await createLobby(lobby);
    if (!created)
      ack({ status: false, error: new Error("Unable to create lobby") });
  });

  socket.on("lobby:connect", async (lobbyId, callback) => {
    //verify the user is authenticated
    const uid = socket.data.userid;
    if (!uid) {
      callback({
        status: false,
        error: new Error("Unauthenticated"),
      });
      return;
    }
    //Fetch the lobby from the redis store
    const lobby = await getLobbyById(lobbyId);
    if (!lobby) {
      callback({
        status: false,
        error: new Error(`Lobby with id: '${lobbyId}' does not exists`),
      });
      return;
    }
    //Check if the player is already registered to the lobby
    const existingConnection = lobby.connections.find(
      (conn) => conn.player.id === uid
    );
    if (existingConnection) {
      const { player } = existingConnection;
      if (player.activeSocket !== socket.id) {
        ///change the active socket
      }
      callback({
        status: true,
        error: null,
        data: lobby,
      });
    }
    //Register the player to the lobby if a spot is available
    else if (lobby.connections.length < 2) {
      const connection = {
        player: {
          id: uid,
          activeSocket: socket.id,
        },
        score: 0,
      };
      lobby.connections.push(connection);
      //Update the lobby in the redis store
      const updated = await updateLobby(lobbyId, lobby);
      if (updated) {
        socket.join(lobbyId);
        callback({
          status: true,
          error: null,
          data: lobby,
        });
      }
    } else {
      callback({
        status: false,
        error: new Error(`Lobby is full`),
      });
    }
  });

  // socket.on("game:move", async (lobbyid: string, move: Chess.Move) => {
  //   const timeRecieved = DateTime.now();
  //   const lagComp = 20;
  //   const uid = socket.data.userid;

  //   if (!uid) return;
  //   //todo unauthenticated emit
  //   const lobby = await getLobbyById(lobbyid);
  //   if (!lobby) return;

  //   //Make sure the player is listed as a connection to the lobby
  //   const authenticated = lobby.connections.find(
  //     (conn) => conn.player.id === uid
  //   );
  //   if (!authenticated) return;

  //   if (socket.id !== authenticated.player.activeSocket) {
  //     //TODO, update the activeSocket and emit to other connections
  //     return;
  //   }
  //   const game = lobby.currentGame;
  //   if (!game.playerIDs || !game.timeRemainingMs || !game.lastMoveTime) return;
  //   //TODO: ID of the player does not match the turn color of the game
  //   if (game.playerIDs[game.gameData.activeColor] !== uid) {
  //     return;
  //   }

  //   const updatedGame = Chess.move(game.gameData, move);
  //   const lastMoveTime = DateTime.fromISO(game.lastMoveTime);

  //   const timeElapsed = timeRecieved.diff(lastMoveTime).milliseconds;

  //   let updatedTimeRemainingMs = {
  //     ...game.timeRemainingMs,
  //   };

  //   const activeColorTimeRemaining =
  //     updatedTimeRemainingMs[game.gameData.activeColor] - timeElapsed + lagComp;
  //   if (activeColorTimeRemaining <= 0) {
  //     //GAME OVER -TIMEOUT
  //     return;
  //   }
  //   updatedTimeRemainingMs[game.gameData.activeColor] =
  //     activeColorTimeRemaining;

  //   const newGame: Game = {
  //     ...game,
  //     timeRemainingMs: updatedTimeRemainingMs,
  //     lastMoveTime: DateTime.now().toISO(),
  //     gameData: updatedGame,
  //   };

  //   const updated = await updateLobby(lobbyid, { currentGame: newGame });
  //   if (updated) io.to(lobbyid).emit("game:move", newGame);
  // });
}

async function getLobbyById(id: string): Promise<Lobby | undefined> {
  const lobby: unknown = await redisClient.json.get(id);
  if (lobby) {
    return lobby as Lobby;
  }
  return undefined;
}

async function updateLobby(
  id: string,
  updates: Partial<Lobby>
): Promise<Lobby | undefined> {
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

async function createLobby(lobby: Lobby): Promise<boolean> {
  const created = await redisClient.json.set(lobby.id, "$", lobby as any);
  if (created) return true;
  return false;
}

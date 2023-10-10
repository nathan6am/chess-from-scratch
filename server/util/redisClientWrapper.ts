import { Lobby, Game, Message, Player, Connection } from "../types/lobby";
import { RedisClient } from "../index";
import _ from "lodash";
import * as Chess from "../../lib/chess";
import { coinflip } from "../../util/misc";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";
const indexed = <T extends {}>(obj: T): T & { [key: string]: never } => obj;

export interface Redis {
  client: RedisClient;
  activeLobbyByUser: (id: string) => Promise<String | null>;
  getLobbyById: (id: string) => Promise<Lobby | undefined>;
  newLobby: (lobby: Lobby) => Promise<Lobby>;
  newGame: (lobbyid: string) => Promise<Game>;
  updateGame: (lobbyid: string, update: Game) => Promise<Game>;
  postMessage: (lobbyid: string, message: Message) => Promise<Message[]>;
  connectToLobby: (lobbyid: string, user: Connection) => Promise<Lobby>;
}

export class Redis implements Redis {
  constructor(client: RedisClient) {
    this.client = client;
  }

  private _exists = async (key: string): Promise<boolean> => {
    const val = await this.client.get(key);
    const json = await this.client.json.get(key);
    if (!val && !json) return false;
    return true;
  };

  private _playerIsInLobby = async (lobbyid: string, playerid: string): Promise<boolean> => {
    const playersJSON: unknown = await this.client.json.get(`lobby:${lobbyid}`, {
      path: ".players",
    });
    if (!playersJSON) return false;
    const players = playersJSON as Player[];
    return players.some((player) => player?.id === playerid);
  };

  private _hasActiveGame = async (lobbyid: string): Promise<boolean> => {
    const lobby = await this.getLobbyById(lobbyid);
    if (!lobby) return false;
    const game = lobby.currentGame;
    if (!game) return false;
    if (game.data.outcome) return false;
    return true;
  };

  private _updateLobby = async (lobbyid: string, updates: Partial<Lobby>): Promise<Lobby> => {
    const lobby = await this.getLobbyById(lobbyid);
    if (!lobby) throw new Error("Lobby does not exist");
    const updatedLobby: Lobby = {
      ...lobby,
      ...updates,
    };
    const updated = await this.client.json.set(`lobby:${lobbyid}`, "$", indexed(updatedLobby));
    if (!updated) throw new Error("Unable to update lobby");
    return updatedLobby;
  };

  generateVerificationToken = async (id: string) => {
    const token = await this.client.set(`token:${id}`, nanoid(), {
      EX: 3600 * 24,
    });
    return token;
  };
  validateVerificationToken = async (id: string, token: string) => {
    const val = await this.client.get(`token:${id}`);
    if (!val) return false;
    if (val === token) return true;
    return false;
  };

  updateLobby = async (lobbyid: string, updates: Partial<Lobby>): Promise<Lobby> => {
    const lobby = await this.getLobbyById(lobbyid);
    if (!lobby) throw new Error("Lobby does not exist");
    const updatedLobby: Lobby = {
      ...lobby,
      ...updates,
    };
    const updated = await this.client.json.set(`lobby:${lobbyid}`, "$", indexed(updatedLobby));
    if (!updated) throw new Error("Unable to update lobby");
    return updatedLobby;
  };
  getLobbyById = async (id: string) => {
    const lobbyJSON: unknown = await this.client.json.get(`lobby:${id}`);
    if (!lobbyJSON) return undefined;
    return lobbyJSON as Lobby;
  };
  // activeLobbyByUser = async (id: string) => {
  //   const lobby = this.client.get(``)
  // }

  //Caches and returns a new lobby
  newLobby = async (lobby: Lobby) => {
    const lobbyJSON = indexed(lobby);
    const created = await this.client.json.set(`lobby:${lobby.id}`, "$", lobbyJSON, { NX: true });
    if (!created) throw new Error("Error creating lobby");
    return lobby;
  };

  //Generates a new game based on the lobby configuration
  newGame = async (lobbyid: string): Promise<Game> => {
    const lobby = await this.getLobbyById(lobbyid);
    if (!lobby) throw new Error(`Lobby with id:'${lobbyid}' does not exist`);
    const hasActiveGame = await this._hasActiveGame(lobbyid);
    if (hasActiveGame) throw new Error("Error creating game: Lobby currently has game in progress");
    //Verify both players are connected
    if (lobby.connections.length < 2) throw new Error("Not enough players connected to start game");
    let players: Record<Chess.Color, Player>;
    //Flip colors if the game is a rematch
    if (lobby.currentGame) {
      players = {
        w: lobby.currentGame.players.b,
        b: lobby.currentGame.players.w,
      };
    } else {
      //Assign colors based on config
      const connectionA = lobby.connections.find((connection) => connection.id === lobby.creatorId);
      if (!connectionA) throw new Error("lobby creator is not connected");
      const playerA = connectionA.player;
      const connectionB = lobby.connections.find((connection) => connection.id !== lobby.creatorId);
      if (!connectionB) throw new Error("Not enough players connected to start game");
      const playerB = connectionB.player;
      const creatorColor = lobby.options.color === "random" ? coinflip<Chess.Color>("w", "b") : lobby.options.color;
      players = {
        w: playerA,
        b: playerB,
      };
      players[creatorColor] = playerA;
      players[creatorColor === "w" ? "b" : "w"] = playerB;
    }
    const timeControl = lobby.options.gameConfig.timeControl;
    if (!timeControl) throw new Error("Correspondence games are not cached using redis store");
    const control = timeControl;
    const timeRemainingMs = {
      w: control.timeSeconds * 1000,
      b: control.timeSeconds * 1000,
    };
    const gameData = Chess.createGame(lobby.options.gameConfig);
    const game: Game = {
      ratingCategory: Chess.inferRatingCategeory(control),
      id: uuidv4(),
      data: gameData,
      players,
      clock: {
        timeRemainingMs,
        lastMoveTimeISO: null,
        incrementMs: control.incrementSeconds * 1000,
      },
    };

    const gameJSON = indexed(game);
    const success = await this.client.json.set(`lobby:${lobbyid}`, ".currentGame", gameJSON);
    if (!success) throw new Error("Error creating game");
    return game;
  };

  //Updates the game at the given lobbyid
  updateGame = async (lobbyid: string, update: Game): Promise<Game> => {
    const gameJSON = indexed(update);
    const updated = await this.client.json.set(`lobby:${lobbyid}`, ".currentGame", gameJSON, {
      XX: true,
    });
    if (!updated) throw new Error("Unable to update game");
    return update;
  };

  //Post a message to the chat of a given lobby and returns the chat in full
  postMessage = async (lobbyid: string, message: Message): Promise<Message[]> => {
    const key = `lobby:${lobbyid}`;
    const exists = await this._exists(key);
    if (!exists) throw new Error("Lobby does not exist");
    if (!this._playerIsInLobby(lobbyid, message.author)) throw new Error("Player is not in lobby");
    const updated = await this.client.json.arrAppend(key, ".chat", indexed(message));
    const chat: unknown = await this.client.json.get(key, { path: ".chat" });
    if (!chat) throw new Error("Could not find chat for lobby");
    return chat as Message[];
  };

  //Connect a player to a lobby
  connectToLobby = async (lobbyid: string, connection: Connection): Promise<Lobby> => {
    const key = `lobby:${lobbyid}`;
    const userid = connection.id;
    const lobby = await this.getLobbyById(lobbyid);
    if (!lobby) throw new Error("Lobby does not exist");

    //Update the socket if the player is already connected
    let updatedConnections = lobby.connections.map((existingConnection) => {
      if (existingConnection.id === userid) {
        return {
          ...existingConnection,
          lastClientSocketId: connection.lastClientSocketId,
          connectionStatus: true,
        };
      }
      return existingConnection;
    });

    //Update the lobby and return if the player was already connected and only the socket was changed
    if (updatedConnections.some((connection) => connection.id === userid)) {
      return await this._updateLobby(lobbyid, {
        connections: updatedConnections,
      });
    }

    //Push the plater and return if a connection is reserverd
    if (lobby.reservedConnections.includes(userid)) {
      updatedConnections.push({ ...connection, connectionStatus: true });
      return await this._updateLobby(lobbyid, {
        connections: updatedConnections,
      });
    }

    if (lobby.reservedConnections.length < 2) {
      updatedConnections.push({ ...connection, connectionStatus: true });
      return await this._updateLobby(lobbyid, {
        reservedConnections: [...lobby.reservedConnections, connection.id],
        connections: updatedConnections,
      });
    }

    throw new Error("Cannot connect to lobby");
  };
}

export function wrapClient(client: RedisClient): Redis {
  return new Redis(client);
}

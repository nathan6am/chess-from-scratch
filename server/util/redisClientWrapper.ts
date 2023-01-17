import { Lobby, Game, Message, Player } from "../types/lobby";
import { RedisClient } from "../index";
import _ from "lodash";
import * as Chess from "../../util/chess";
import { coinflip } from "../../util/misc";
import { v4 as uuidv4 } from "uuid";
import { socket } from "@/context/socket";
const indexed = <T extends {}>(obj: T): T & { [key: string]: never } => obj;

export interface Redis {
  client: RedisClient;
  activeLobbyByUser: (id: string) => Promise<String | null>;
  getLobbyById: (id: string) => Promise<Lobby | undefined>;
  newLobby: (lobby: Lobby) => Promise<Lobby>;
  newGame: (lobbyid: string) => Promise<Game>;
  updateGame: (lobbyid: string, update: Game) => Promise<Game>;
  postMessage: (lobbyid: string, message: Message) => Promise<Message[]>;
  connectToLobby: (lobbyid: string, player: Player) => Promise<Lobby>;
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

  private _playerIsInLobby = async (
    lobbyid: string,
    playerid: string
  ): Promise<boolean> => {
    const playersJSON: unknown = await this.client.json.get(
      `lobby:${lobbyid}`,
      { path: ".players" }
    );
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

  private _updateLobby = async (
    lobbyid: string,
    updates: Partial<Lobby>
  ): Promise<Lobby> => {
    const lobby = await this.getLobbyById(lobbyid);
    if (!lobby) throw new Error("Lobby does not exist");
    const updatedLobby: Lobby = {
      ...lobby,
      ...updates,
    };
    const updated = await this.client.json.set(
      `lobby:${lobbyid}`,
      "$",
      indexed(updatedLobby)
    );
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
    const created = await this.client.json.set(
      `lobby:${lobby.id}`,
      "$",
      lobbyJSON,
      { NX: true }
    );
    if (!created) throw new Error("Error creating lobby");
    return lobby;
  };

  //Generates a new game based on the lobby configuration
  newGame = async (lobbyid: string): Promise<Game> => {
    const lobby = await this.getLobbyById(lobbyid);
    if (!lobby) throw new Error(`Lobby with id:'${lobbyid}' does not exist`);
    const hasActiveGame = await this._hasActiveGame(lobbyid);
    if (hasActiveGame)
      throw new Error(
        "Error creating game: Lobby currently has game in progress"
      );
    //Verify both players are connected
    if (lobby.players.length < 2)
      throw new Error("Not enough players connected to start game");
    let players = {
      w: "",
      b: "",
    };
    //Flip colors if the game is a rematch
    if (lobby.currentGame) {
      players = {
        w: lobby.currentGame.players.b,
        b: lobby.currentGame.players.w,
      };
    } else {
      //Assign colors based on config
      const playerA = lobby.creator;
      const playerB = lobby.players.find(
        (player) => player.id !== lobby.creator
      )?.id;
      if (!playerB)
        throw new Error("Not enough players connected to start game");
      const creatorColor =
        lobby.options.color === "random"
          ? coinflip<Chess.Color>("w", "b")
          : lobby.options.color;
      players[creatorColor] = playerA;
      players[creatorColor === "w" ? "b" : "w"] = playerB;
    }
    const timeControls = lobby.options.gameConfig.timeControls;
    if (!(timeControls && timeControls.length))
      throw new Error("Correspondence games are not cached using redis store");
    const control = timeControls[0];
    const timeRemainingMs = {
      w: control.timeSeconds * 1000,
      b: control.timeSeconds * 1000,
    };
    const gameData = Chess.createGame(lobby.options.gameConfig);

    const game: Game = {
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
    const success = await this.client.json.set(
      `lobby:${lobbyid}`,
      ".currentGame",
      gameJSON
    );
    if (!success) throw new Error("Error creating game");
    return game;
  };

  //Updates the game at the given lobbyid
  updateGame = async (lobbyid: string, update: Game): Promise<Game> => {
    const gameJSON = indexed(update);
    const updated = await this.client.json.set(
      `lobby:${lobbyid}`,
      ".currentGame",
      gameJSON,
      { XX: true }
    );
    if (!updated) throw new Error("Unable to update game");
    return update;
  };

  //Post a message to the chat of a given lobby and returns the chat in full
  postMessage = async (
    lobbyid: string,
    message: Message
  ): Promise<Message[]> => {
    const key = `lobby:${lobbyid}`;
    const exists = await this._exists(key);
    if (!exists) throw new Error("Lobby does not exist");
    if (!this._playerIsInLobby(lobbyid, message.author))
      throw new Error("Player is not in lobby");
    const updated = await this.client.json.arrAppend(
      key,
      ".chat",
      indexed(message)
    );
    const chat: unknown = await this.client.json.get(key, { path: ".chat" });
    if (!chat) throw new Error("Could not find chat for lobby");
    return chat as Message[];
  };

  //Connect a player to a lobby
  connectToLobby = async (lobbyid: string, player: Player): Promise<Lobby> => {
    const key = `lobby:${lobbyid}`;
    const userid = player.id;
    const lobby = await this.getLobbyById(lobbyid);
    if (!lobby) throw new Error("Lobby does not exist");
    const players = lobby.players;
    if (lobby.reservedConnections.includes(player.id)) {
      const updatedPlayers = players.map((connectedPlayer) => {
        if (connectedPlayer.id !== player.id) return connectedPlayer;
        return {
          ...connectedPlayer,
          primaryClientSocketId: player.primaryClientSocketId,
        };
      });
      if (!updatedPlayers.some((player) => player.id === userid)) {
        updatedPlayers.push(player);
      }
      if (updatedPlayers.length > 2)
        throw new Error("Too many connections to lobby");
      const updated = await this._updateLobby(lobbyid, {
        players: updatedPlayers,
      });
      return updated;
    } else if (
      lobby.reservedConnections.length < 2 &&
      lobby.players.length < 2
    ) {
      const reservedConnections = [...lobby.reservedConnections, player.id];
      const updatedPlayers = [...players, player];
      const updated = await this._updateLobby(lobbyid, {
        players: updatedPlayers,
        reservedConnections,
      });
      return updated;
    } else {
      throw new Error("Lobby is full");
    }
  };
}

export function wrapClient(client: RedisClient): Redis {
  return new Redis(client);
}

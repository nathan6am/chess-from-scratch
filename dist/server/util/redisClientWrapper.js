"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapClient = exports.Redis = void 0;
const Chess = __importStar(require("../../lib/chess"));
const misc_1 = require("../../util/misc");
const uuid_1 = require("uuid");
const nanoid_1 = require("nanoid");
const indexed = (obj) => obj;
class Redis {
    constructor(client) {
        this.client = client;
    }
    _exists = async (key) => {
        const val = await this.client.get(key);
        const json = await this.client.json.get(key);
        if (!val && !json)
            return false;
        return true;
    };
    _playerIsInLobby = async (lobbyid, playerid) => {
        const playersJSON = await this.client.json.get(`lobby:${lobbyid}`, {
            path: ".players",
        });
        if (!playersJSON)
            return false;
        const players = playersJSON;
        return players.some((player) => player?.id === playerid);
    };
    _hasActiveGame = async (lobbyid) => {
        const lobby = await this.getLobbyById(lobbyid);
        if (!lobby)
            return false;
        const game = lobby.currentGame;
        if (!game)
            return false;
        if (game.data.outcome)
            return false;
        return true;
    };
    _updateLobby = async (lobbyid, updates) => {
        const lobby = await this.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("Lobby does not exist");
        const updatedLobby = {
            ...lobby,
            ...updates,
        };
        const updated = await this.client.json.set(`lobby:${lobbyid}`, "$", indexed(updatedLobby));
        if (!updated)
            throw new Error("Unable to update lobby");
        return updatedLobby;
    };
    generateVerificationToken = async (id) => {
        const token = await this.client.set(`token:${id}`, (0, nanoid_1.nanoid)(), {
            EX: 3600 * 24,
        });
        return token;
    };
    validateVerificationToken = async (id, token) => {
        const val = await this.client.get(`token:${id}`);
        if (!val)
            return false;
        if (val === token) {
            this.client.del(`token:${id}`);
        }
        return false;
    };
    updateLobby = async (lobbyid, updates) => {
        const lobby = await this.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("Lobby does not exist");
        const updatedLobby = {
            ...lobby,
            ...updates,
        };
        const updated = await this.client.json.set(`lobby:${lobbyid}`, "$", indexed(updatedLobby));
        if (!updated)
            throw new Error("Unable to update lobby");
        return updatedLobby;
    };
    getLobbyById = async (id) => {
        const lobbyJSON = await this.client.json.get(`lobby:${id}`);
        if (!lobbyJSON)
            return undefined;
        return lobbyJSON;
    };
    // activeLobbyByUser = async (id: string) => {
    //   const lobby = this.client.get(``)
    // }
    //Caches and returns a new lobby
    newLobby = async (lobby) => {
        const lobbyJSON = indexed(lobby);
        const created = await this.client.json.set(`lobby:${lobby.id}`, "$", lobbyJSON, { NX: true });
        if (!created)
            throw new Error("Error creating lobby");
        return lobby;
    };
    //Generates a new game based on the lobby configuration
    newGame = async (lobbyid) => {
        const lobby = await this.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error(`Lobby with id:'${lobbyid}' does not exist`);
        const hasActiveGame = await this._hasActiveGame(lobbyid);
        if (hasActiveGame)
            throw new Error("Error creating game: Lobby currently has game in progress");
        //Verify both players are connected
        if (lobby.connections.length < 2)
            throw new Error("Not enough players connected to start game");
        let players;
        //Flip colors if the game is a rematch
        if (lobby.currentGame) {
            players = {
                w: lobby.currentGame.players.b,
                b: lobby.currentGame.players.w,
            };
        }
        else {
            //Assign colors based on config
            const connectionA = lobby.connections.find((connection) => connection.id === lobby.creatorId);
            if (!connectionA)
                throw new Error("lobby creator is not connected");
            const playerA = connectionA.player;
            const connectionB = lobby.connections.find((connection) => connection.id !== lobby.creatorId);
            if (!connectionB)
                throw new Error("Not enough players connected to start game");
            const playerB = connectionB.player;
            const creatorColor = lobby.options.color === "random" ? (0, misc_1.coinflip)("w", "b") : lobby.options.color;
            players = {
                w: playerA,
                b: playerB,
            };
            players[creatorColor] = playerA;
            players[creatorColor === "w" ? "b" : "w"] = playerB;
        }
        const timeControl = lobby.options.gameConfig.timeControl;
        if (!timeControl)
            throw new Error("Correspondence games are not cached using redis store");
        const control = timeControl;
        const timeRemainingMs = {
            w: control.timeSeconds * 1000,
            b: control.timeSeconds * 1000,
        };
        const hasGuest = lobby.connections.some((connection) => connection.player.type === "guest");
        const gameData = Chess.createGame(lobby.options.gameConfig);
        const game = {
            rated: hasGuest ? false : lobby.options.rated,
            ratingCategory: Chess.inferRatingCategeory(control),
            id: (0, uuid_1.v4)(),
            data: gameData,
            players,
            clock: {
                timeRemainingMs,
                lastMoveTimeISO: null,
                incrementMs: control.incrementSeconds * 1000,
            },
        };
        const gameJSON = indexed(game);
        const resetRematchOffers = await this.client.json.set(`lobby:${lobbyid}`, ".rematchRequested", {
            w: null,
            b: null,
        });
        const success = await this.client.json.set(`lobby:${lobbyid}`, ".currentGame", gameJSON);
        if (!success)
            throw new Error("Error creating game");
        return game;
    };
    //Updates the game at the given lobbyid
    updateGame = async (lobbyid, update) => {
        const gameJSON = indexed(update);
        const updated = await this.client.json.set(`lobby:${lobbyid}`, ".currentGame", gameJSON, {
            XX: true,
        });
        if (!updated)
            throw new Error("Unable to update game");
        return update;
    };
    //Post a message to the chat of a given lobby and returns the chat in full
    postMessage = async (lobbyid, message) => {
        const key = `lobby:${lobbyid}`;
        const exists = await this._exists(key);
        if (!exists)
            throw new Error("Lobby does not exist");
        if (!this._playerIsInLobby(lobbyid, message.author))
            throw new Error("Player is not in lobby");
        const updated = await this.client.json.arrAppend(key, ".chat", indexed(message));
        const chat = await this.client.json.get(key, { path: ".chat" });
        if (!chat)
            throw new Error("Could not find chat for lobby");
        return chat;
    };
    //Connect a player to a lobby
    connectToLobby = async (lobbyid, connection) => {
        const key = `lobby:${lobbyid}`;
        const userid = connection.id;
        const lobby = await this.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("Lobby does not exist");
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
    disconnectFromLobby = async (lobbyid, { userid, timestampISO, socketid, }) => {
        const lobby = await this.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("Lobby does not exist");
        const updatedConnections = lobby.connections.map((connection) => {
            if (connection.id === userid && connection.lastClientSocketId === socketid) {
                return {
                    ...connection,
                    connectionStatus: false,
                    lastDisconnect: timestampISO,
                };
            }
            return connection;
        });
        return await this._updateLobby(lobbyid, {
            connections: updatedConnections,
        });
    };
}
exports.Redis = Redis;
function wrapClient(client) {
    return new Redis(client);
}
exports.wrapClient = wrapClient;

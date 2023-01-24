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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapClient = exports.Redis = void 0;
const Chess = __importStar(require("../../lib/chess"));
const misc_1 = require("../../util/misc");
const uuid_1 = require("uuid");
const indexed = (obj) => obj;
class Redis {
    constructor(client) {
        this._exists = (key) => __awaiter(this, void 0, void 0, function* () {
            const val = yield this.client.get(key);
            const json = yield this.client.json.get(key);
            if (!val && !json)
                return false;
            return true;
        });
        this._playerIsInLobby = (lobbyid, playerid) => __awaiter(this, void 0, void 0, function* () {
            const playersJSON = yield this.client.json.get(`lobby:${lobbyid}`, { path: ".players" });
            if (!playersJSON)
                return false;
            const players = playersJSON;
            return players.some((player) => (player === null || player === void 0 ? void 0 : player.id) === playerid);
        });
        this._hasActiveGame = (lobbyid) => __awaiter(this, void 0, void 0, function* () {
            const lobby = yield this.getLobbyById(lobbyid);
            if (!lobby)
                return false;
            const game = lobby.currentGame;
            if (!game)
                return false;
            if (game.data.outcome)
                return false;
            return true;
        });
        this._updateLobby = (lobbyid, updates) => __awaiter(this, void 0, void 0, function* () {
            const lobby = yield this.getLobbyById(lobbyid);
            if (!lobby)
                throw new Error("Lobby does not exist");
            const updatedLobby = Object.assign(Object.assign({}, lobby), updates);
            const updated = yield this.client.json.set(`lobby:${lobbyid}`, "$", indexed(updatedLobby));
            if (!updated)
                throw new Error("Unable to update lobby");
            return updatedLobby;
        });
        this.getLobbyById = (id) => __awaiter(this, void 0, void 0, function* () {
            const lobbyJSON = yield this.client.json.get(`lobby:${id}`);
            if (!lobbyJSON)
                return undefined;
            return lobbyJSON;
        });
        // activeLobbyByUser = async (id: string) => {
        //   const lobby = this.client.get(``)
        // }
        //Caches and returns a new lobby
        this.newLobby = (lobby) => __awaiter(this, void 0, void 0, function* () {
            const lobbyJSON = indexed(lobby);
            const created = yield this.client.json.set(`lobby:${lobby.id}`, "$", lobbyJSON, { NX: true });
            if (!created)
                throw new Error("Error creating lobby");
            return lobby;
        });
        //Generates a new game based on the lobby configuration
        this.newGame = (lobbyid) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const lobby = yield this.getLobbyById(lobbyid);
            if (!lobby)
                throw new Error(`Lobby with id:'${lobbyid}' does not exist`);
            const hasActiveGame = yield this._hasActiveGame(lobbyid);
            if (hasActiveGame)
                throw new Error("Error creating game: Lobby currently has game in progress");
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
            }
            else {
                //Assign colors based on config
                const playerA = lobby.creator;
                const playerB = (_a = lobby.players.find((player) => player.id !== lobby.creator)) === null || _a === void 0 ? void 0 : _a.id;
                if (!playerB)
                    throw new Error("Not enough players connected to start game");
                const creatorColor = lobby.options.color === "random" ? (0, misc_1.coinflip)("w", "b") : lobby.options.color;
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
            const game = {
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
            const success = yield this.client.json.set(`lobby:${lobbyid}`, ".currentGame", gameJSON);
            if (!success)
                throw new Error("Error creating game");
            return game;
        });
        //Updates the game at the given lobbyid
        this.updateGame = (lobbyid, update) => __awaiter(this, void 0, void 0, function* () {
            const gameJSON = indexed(update);
            const updated = yield this.client.json.set(`lobby:${lobbyid}`, ".currentGame", gameJSON, { XX: true });
            if (!updated)
                throw new Error("Unable to update game");
            return update;
        });
        //Post a message to the chat of a given lobby and returns the chat in full
        this.postMessage = (lobbyid, message) => __awaiter(this, void 0, void 0, function* () {
            const key = `lobby:${lobbyid}`;
            const exists = yield this._exists(key);
            if (!exists)
                throw new Error("Lobby does not exist");
            if (!this._playerIsInLobby(lobbyid, message.author))
                throw new Error("Player is not in lobby");
            const updated = yield this.client.json.arrAppend(key, ".chat", indexed(message));
            const chat = yield this.client.json.get(key, { path: ".chat" });
            if (!chat)
                throw new Error("Could not find chat for lobby");
            return chat;
        });
        //Connect a player to a lobby
        this.connectToLobby = (lobbyid, player) => __awaiter(this, void 0, void 0, function* () {
            const key = `lobby:${lobbyid}`;
            const userid = player.id;
            const lobby = yield this.getLobbyById(lobbyid);
            if (!lobby)
                throw new Error("Lobby does not exist");
            //Update the socket if the player is already connected
            let updatedPlayers = lobby.players.map((existingPlayer) => {
                if (existingPlayer.id === userid) {
                    return Object.assign(Object.assign({}, existingPlayer), { primaryClientSocketId: player.primaryClientSocketId });
                }
                return existingPlayer;
            });
            //Update the lobby and return if the player was already connected and only the socket was changed
            if (updatedPlayers.some((player) => player.id === userid)) {
                return yield this._updateLobby(lobbyid, {
                    players: updatedPlayers,
                });
            }
            //Push the plater and return if a connection is reserverd
            if (lobby.reservedConnections.includes(userid)) {
                updatedPlayers.push(player);
                return yield this._updateLobby(lobbyid, {
                    players: updatedPlayers,
                });
            }
            if (lobby.reservedConnections.length < 2) {
                updatedPlayers.push(player);
                return yield this._updateLobby(lobbyid, {
                    reservedConnections: [...lobby.reservedConnections, player.id],
                    players: updatedPlayers,
                });
            }
            throw new Error("Cannot connect to lobby");
        });
        this.client = client;
    }
}
exports.Redis = Redis;
function wrapClient(client) {
    return new Redis(client);
}
exports.wrapClient = wrapClient;

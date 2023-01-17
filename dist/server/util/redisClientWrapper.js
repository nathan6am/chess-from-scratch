"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapClient = exports.Redis = void 0;
var Chess = __importStar(require("../../util/chess"));
var misc_1 = require("../../util/misc");
var uuid_1 = require("uuid");
var indexed = function (obj) { return obj; };
var Redis = /** @class */ (function () {
    function Redis(client) {
        var _this = this;
        this._exists = function (key) { return __awaiter(_this, void 0, void 0, function () {
            var val, json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.get(key)];
                    case 1:
                        val = _a.sent();
                        return [4 /*yield*/, this.client.json.get(key)];
                    case 2:
                        json = _a.sent();
                        if (!val && !json)
                            return [2 /*return*/, false];
                        return [2 /*return*/, true];
                }
            });
        }); };
        this._playerIsInLobby = function (lobbyid, playerid) { return __awaiter(_this, void 0, void 0, function () {
            var playersJSON, players;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.json.get("lobby:".concat(lobbyid), { path: ".players" })];
                    case 1:
                        playersJSON = _a.sent();
                        if (!playersJSON)
                            return [2 /*return*/, false];
                        players = playersJSON;
                        return [2 /*return*/, players.some(function (player) { return (player === null || player === void 0 ? void 0 : player.id) === playerid; })];
                }
            });
        }); };
        this._hasActiveGame = function (lobbyid) { return __awaiter(_this, void 0, void 0, function () {
            var lobby, game;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getLobbyById(lobbyid)];
                    case 1:
                        lobby = _a.sent();
                        if (!lobby)
                            return [2 /*return*/, false];
                        game = lobby.currentGame;
                        if (!game)
                            return [2 /*return*/, false];
                        if (game.data.outcome)
                            return [2 /*return*/, false];
                        return [2 /*return*/, true];
                }
            });
        }); };
        this._updateLobby = function (lobbyid, updates) { return __awaiter(_this, void 0, void 0, function () {
            var lobby, updatedLobby, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getLobbyById(lobbyid)];
                    case 1:
                        lobby = _a.sent();
                        if (!lobby)
                            throw new Error("Lobby does not exist");
                        updatedLobby = __assign(__assign({}, lobby), updates);
                        return [4 /*yield*/, this.client.json.set("lobby:".concat(lobbyid), "$", indexed(updatedLobby))];
                    case 2:
                        updated = _a.sent();
                        if (!updated)
                            throw new Error("Unable to update lobby");
                        return [2 /*return*/, updatedLobby];
                }
            });
        }); };
        this.getLobbyById = function (id) { return __awaiter(_this, void 0, void 0, function () {
            var lobbyJSON;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.json.get("lobby:".concat(id))];
                    case 1:
                        lobbyJSON = _a.sent();
                        if (!lobbyJSON)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, lobbyJSON];
                }
            });
        }); };
        // activeLobbyByUser = async (id: string) => {
        //   const lobby = this.client.get(``)
        // }
        //Caches and returns a new lobby
        this.newLobby = function (lobby) { return __awaiter(_this, void 0, void 0, function () {
            var lobbyJSON, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lobbyJSON = indexed(lobby);
                        return [4 /*yield*/, this.client.json.set("lobby:".concat(lobby.id), "$", lobbyJSON, { NX: true })];
                    case 1:
                        created = _a.sent();
                        if (!created)
                            throw new Error("Error creating lobby");
                        return [2 /*return*/, lobby];
                }
            });
        }); };
        //Generates a new game based on the lobby configuration
        this.newGame = function (lobbyid) { return __awaiter(_this, void 0, void 0, function () {
            var lobby, hasActiveGame, players, playerA, playerB, creatorColor, timeControls, control, timeRemainingMs, gameData, game, gameJSON, success;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getLobbyById(lobbyid)];
                    case 1:
                        lobby = _b.sent();
                        if (!lobby)
                            throw new Error("Lobby with id:'".concat(lobbyid, "' does not exist"));
                        return [4 /*yield*/, this._hasActiveGame(lobbyid)];
                    case 2:
                        hasActiveGame = _b.sent();
                        if (hasActiveGame)
                            throw new Error("Error creating game: Lobby currently has game in progress");
                        //Verify both players are connected
                        if (lobby.players.length < 2)
                            throw new Error("Not enough players connected to start game");
                        players = {
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
                            playerA = lobby.creator;
                            playerB = (_a = lobby.players.find(function (player) { return player.id !== lobby.creator; })) === null || _a === void 0 ? void 0 : _a.id;
                            if (!playerB)
                                throw new Error("Not enough players connected to start game");
                            creatorColor = lobby.options.color === "random"
                                ? (0, misc_1.coinflip)("w", "b")
                                : lobby.options.color;
                            players[creatorColor] = playerA;
                            players[creatorColor === "w" ? "b" : "w"] = playerB;
                        }
                        timeControls = lobby.options.gameConfig.timeControls;
                        if (!(timeControls && timeControls.length))
                            throw new Error("Correspondence games are not cached using redis store");
                        control = timeControls[0];
                        timeRemainingMs = {
                            w: control.timeSeconds * 1000,
                            b: control.timeSeconds * 1000,
                        };
                        gameData = Chess.createGame(lobby.options.gameConfig);
                        game = {
                            id: (0, uuid_1.v4)(),
                            data: gameData,
                            players: players,
                            clock: {
                                timeRemainingMs: timeRemainingMs,
                                lastMoveTimeISO: null,
                                incrementMs: control.incrementSeconds * 1000,
                            },
                        };
                        gameJSON = indexed(game);
                        return [4 /*yield*/, this.client.json.set("lobby:".concat(lobbyid), ".currentGame", gameJSON)];
                    case 3:
                        success = _b.sent();
                        if (!success)
                            throw new Error("Error creating game");
                        return [2 /*return*/, game];
                }
            });
        }); };
        //Updates the game at the given lobbyid
        this.updateGame = function (lobbyid, update) { return __awaiter(_this, void 0, void 0, function () {
            var gameJSON, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        gameJSON = indexed(update);
                        return [4 /*yield*/, this.client.json.set("lobby:".concat(lobbyid), ".currentGame", gameJSON, { XX: true })];
                    case 1:
                        updated = _a.sent();
                        if (!updated)
                            throw new Error("Unable to update game");
                        return [2 /*return*/, update];
                }
            });
        }); };
        //Post a message to the chat of a given lobby and returns the chat in full
        this.postMessage = function (lobbyid, message) { return __awaiter(_this, void 0, void 0, function () {
            var key, exists, updated, chat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "lobby:".concat(lobbyid);
                        return [4 /*yield*/, this._exists(key)];
                    case 1:
                        exists = _a.sent();
                        if (!exists)
                            throw new Error("Lobby does not exist");
                        if (!this._playerIsInLobby(lobbyid, message.author))
                            throw new Error("Player is not in lobby");
                        return [4 /*yield*/, this.client.json.arrAppend(key, ".chat", indexed(message))];
                    case 2:
                        updated = _a.sent();
                        return [4 /*yield*/, this.client.json.get(key, { path: ".chat" })];
                    case 3:
                        chat = _a.sent();
                        if (!chat)
                            throw new Error("Could not find chat for lobby");
                        return [2 /*return*/, chat];
                }
            });
        }); };
        //Connect a player to a lobby
        this.connectToLobby = function (lobbyid, player) { return __awaiter(_this, void 0, void 0, function () {
            var key, userid, lobby, players, updatedPlayers, updated, reservedConnections, updatedPlayers, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = "lobby:".concat(lobbyid);
                        userid = player.id;
                        return [4 /*yield*/, this.getLobbyById(lobbyid)];
                    case 1:
                        lobby = _a.sent();
                        if (!lobby)
                            throw new Error("Lobby does not exist");
                        players = lobby.players;
                        if (!lobby.reservedConnections.includes(player.id)) return [3 /*break*/, 3];
                        updatedPlayers = players.map(function (connectedPlayer) {
                            if (connectedPlayer.id !== player.id)
                                return connectedPlayer;
                            return __assign(__assign({}, connectedPlayer), { primaryClientSocketId: player.primaryClientSocketId });
                        });
                        if (!updatedPlayers.some(function (player) { return player.id === userid; })) {
                            updatedPlayers.push(player);
                        }
                        if (updatedPlayers.length > 2)
                            throw new Error("Too many connections to lobby");
                        return [4 /*yield*/, this._updateLobby(lobbyid, {
                                players: updatedPlayers,
                            })];
                    case 2:
                        updated = _a.sent();
                        return [2 /*return*/, updated];
                    case 3:
                        if (!(lobby.reservedConnections.length < 2 &&
                            lobby.players.length < 2)) return [3 /*break*/, 5];
                        reservedConnections = __spreadArray(__spreadArray([], __read(lobby.reservedConnections), false), [player.id], false);
                        updatedPlayers = __spreadArray(__spreadArray([], __read(players), false), [player], false);
                        return [4 /*yield*/, this._updateLobby(lobbyid, {
                                players: updatedPlayers,
                                reservedConnections: reservedConnections,
                            })];
                    case 4:
                        updated = _a.sent();
                        return [2 /*return*/, updated];
                    case 5: throw new Error("Lobby is full");
                }
            });
        }); };
        this.client = client;
    }
    return Redis;
}());
exports.Redis = Redis;
function wrapClient(client) {
    return new Redis(client);
}
exports.wrapClient = wrapClient;

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var nanoid_1 = require("nanoid");
var sessionClient_1 = __importDefault(require("../redis/sessionClient"));
var Chess = __importStar(require("../../util/chess"));
var luxon_1 = require("luxon");
function default_1(io, socket) {
    var _this = this;
    socket.on("lobby:create", function (options, callback) { return __awaiter(_this, void 0, void 0, function () {
        var id, uid, gameJSON, lobby, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    id = (0, nanoid_1.nanoid)(10);
                    uid = socket.userID;
                    if (!uid)
                        return [2 /*return*/];
                    gameJSON = Chess.createGame();
                    lobby = {
                        connections: [
                            {
                                player: uid,
                                activeSocket: socket.id,
                            },
                        ],
                        gameData: gameJSON,
                    };
                    return [4 /*yield*/, sessionClient_1.default.json.set(id, "$", lobby)];
                case 1:
                    _c.sent();
                    console.log(id);
                    _b = (_a = console).log;
                    return [4 /*yield*/, sessionClient_1.default.json.get(id)];
                case 2:
                    _b.apply(_a, [_c.sent()]);
                    return [2 /*return*/];
            }
        });
    }); });
    socket.on("lobby:connect", function (lobbyId, callback) { return __awaiter(_this, void 0, void 0, function () {
        var uid, lobby, existingConnection, player, player, connection, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    uid = socket.userID;
                    if (!uid) {
                        callback({
                            connected: false,
                            message: "Unauthenticated",
                        });
                        return [2 /*return*/];
                    }
                    console.log("getting lobby");
                    return [4 /*yield*/, getLobbyById(lobbyId)];
                case 1:
                    lobby = _a.sent();
                    if (!lobby) {
                        callback({
                            connected: false,
                            message: "Lobby does not exist",
                        });
                        return [2 /*return*/];
                    }
                    existingConnection = lobby.connections.find(function (conn) { return conn.player.id === uid; });
                    if (!existingConnection) return [3 /*break*/, 2];
                    player = existingConnection.player;
                    if (player.activeSocket !== socket.id) {
                        ///change the active socket
                    }
                    return [3 /*break*/, 5];
                case 2:
                    if (!(lobby.connections.length < 2)) return [3 /*break*/, 4];
                    player = {
                        id: uid,
                        activeSocket: socket.id,
                    };
                    connection = {
                        player: player,
                        score: 0,
                    };
                    lobby.connections.push(connection);
                    return [4 /*yield*/, updateLobby(lobbyId, lobby)];
                case 3:
                    updated = _a.sent();
                    if (updated) {
                        socket.join(lobbyId);
                        callback({
                            connected: true,
                            lobby: lobby,
                        });
                    }
                    return [3 /*break*/, 5];
                case 4:
                    callback({
                        connected: false,
                        message: "Lobby full",
                    });
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); });
    socket.on("game:move", function (lobbyid, move) { return __awaiter(_this, void 0, void 0, function () {
        var timeRecieved, lagComp, uid, lobby, authenticated, game, updatedGame, lastMoveTime, timeElapsed, updatedTimeRemainingMs, activeColorTimeRemaining, newGame, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    timeRecieved = luxon_1.DateTime.now();
                    lagComp = 20;
                    uid = socket.userID;
                    if (!uid)
                        return [2 /*return*/];
                    return [4 /*yield*/, getLobbyById(lobbyid)];
                case 1:
                    lobby = _a.sent();
                    if (!lobby)
                        return [2 /*return*/];
                    authenticated = lobby.connections.find(function (conn) { return conn.player.id === uid; });
                    if (!authenticated)
                        return [2 /*return*/];
                    if (socket.id !== authenticated.player.activeSocket) {
                        //TODO, update the activeSocket and emit to other connections
                        return [2 /*return*/];
                    }
                    game = lobby.currentGame;
                    //TODO: ID of the player does not match the turn color of the game
                    if (game.playerIDs[game.gameData.activeColor] !== uid) {
                        return [2 /*return*/];
                    }
                    updatedGame = Chess.move(game.gameData, move);
                    lastMoveTime = luxon_1.DateTime.fromISO(game.lastMoveTime);
                    timeElapsed = timeRecieved.diff(lastMoveTime).milliseconds;
                    updatedTimeRemainingMs = __assign({}, game.timeRemainingMs);
                    activeColorTimeRemaining = updatedTimeRemainingMs[game.gameData.activeColor] - timeElapsed + lagComp;
                    if (activeColorTimeRemaining <= 0) {
                        //GAME OVER -TIMEOUT
                        return [2 /*return*/];
                    }
                    updatedTimeRemainingMs[game.gameData.activeColor] = activeColorTimeRemaining;
                    newGame = __assign(__assign({}, game), { timeRemainingMs: updatedTimeRemainingMs, lastMoveTime: luxon_1.DateTime.now().toISO(), gameData: updatedGame });
                    return [4 /*yield*/, updateLobby(lobbyid, { currentGame: newGame })];
                case 2:
                    updated = _a.sent();
                    if (updated)
                        io.to(lobbyid).emit("game:move", newGame);
                    return [2 /*return*/];
            }
        });
    }); });
}
exports.default = default_1;
function getLobbyById(id) {
    return __awaiter(this, void 0, void 0, function () {
        var lobby;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(id);
                    return [4 /*yield*/, sessionClient_1.default.json.get(id)];
                case 1:
                    lobby = _a.sent();
                    console.log(lobby);
                    if (lobby) {
                        return [2 /*return*/, lobby];
                    }
                    return [2 /*return*/, undefined];
            }
        });
    });
}
function updateLobby(id, updates) {
    return __awaiter(this, void 0, void 0, function () {
        var lobby, updatedLobby, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getLobbyById(id)];
                case 1:
                    lobby = _a.sent();
                    if (!lobby)
                        return [2 /*return*/, undefined];
                    updatedLobby = __assign(__assign({}, updates), lobby);
                    return [4 /*yield*/, sessionClient_1.default.json.set(id, "$", updatedLobby)];
                case 2:
                    updated = _a.sent();
                    if (updated) {
                        return [2 /*return*/, updatedLobby];
                    }
                    else {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/];
            }
        });
    });
}

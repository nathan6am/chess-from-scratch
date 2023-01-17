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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
var redisClientWrapper_1 = require("../util/redisClientWrapper");
var Chess = __importStar(require("../../util/chess"));
var clockFunctions_1 = require("../util/clockFunctions");
function LobbyHandler(io, nsp, socket, redisClient) {
    var _this = this;
    var cache = (0, redisClientWrapper_1.wrapClient)(redisClient);
    socket.on("disconnect", function () {
        //Find the active game if applicable and set a timeout for reconnection
        //or, abort the game if it has not yet started
        console.log("Client ".concat(socket.data.userid, " has disconnected"));
    });
    socket.on("test:timeout", function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            console.log("testing");
            socket.timeout(10000).emit("test:requestAck", "hello", function (err, arg) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log(arg);
                }
            });
            return [2 /*return*/];
        });
    }); });
    /*
     *  Connects a player to a lobby, and starts the game if both players are
     *  connected
     * */
    socket.on("lobby:connect", function (lobbyid, ack) { return __awaiter(_this, void 0, void 0, function () {
        var userid, lobby, player, lobby_1, game, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    userid = socket.data.userid;
                    if (!userid)
                        throw new Error("Unauthenticated");
                    return [4 /*yield*/, cache.getLobbyById(lobbyid)];
                case 1:
                    lobby = _a.sent();
                    if (!lobby)
                        throw new Error("Lobby does not exist");
                    if (!(lobby.reservedConnections.includes(userid) ||
                        (lobby.reservedConnections.length < 2 && lobby.players.length < 2))) return [3 /*break*/, 5];
                    player = {
                        id: userid,
                        score: 0,
                        primaryClientSocketId: socket.id,
                    };
                    return [4 /*yield*/, cache.connectToLobby(lobbyid, player)];
                case 2:
                    lobby_1 = _a.sent();
                    socket.join(lobbyid);
                    //Return the lobby to the client and start the game if both players are connected and
                    ack({ status: true, data: lobby_1, error: null });
                    if (!(lobby_1.players.length === 2 && lobby_1.currentGame === null)) return [3 /*break*/, 4];
                    return [4 /*yield*/, cache.newGame(lobbyid)];
                case 3:
                    game = _a.sent();
                    nsp.to(lobbyid).emit("game:new", game);
                    _a.label = 4;
                case 4: return [2 /*return*/];
                case 5:
                    ack({ status: false, error: new Error("Lobby is full") });
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    //Log any errors and pass them in the response to the client
                    console.error(err_1);
                    if (err_1 instanceof Error) {
                        ack({ status: false, error: err_1 });
                    }
                    else {
                        ack({ status: false, error: new Error("Unable to connect to lobby") });
                    }
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); });
    var socketInstanceById = function (socketId) { return __awaiter(_this, void 0, void 0, function () {
        var sockets, sockets_1, sockets_1_1, socket_1;
        var e_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, io.in(socketId).fetchSockets()];
                case 1:
                    sockets = _b.sent();
                    try {
                        for (sockets_1 = __values(sockets), sockets_1_1 = sockets_1.next(); !sockets_1_1.done; sockets_1_1 = sockets_1.next()) {
                            socket_1 = sockets_1_1.value;
                            if (socket_1.id === socketId)
                                return [2 /*return*/, socket_1];
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (sockets_1_1 && !sockets_1_1.done && (_a = sockets_1.return)) _a.call(sockets_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    function startGame(lobbyid) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var lobby, game, playerW, playerWhiteSocketId;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, cache.getLobbyById(lobbyid)];
                    case 1:
                        lobby = _b.sent();
                        if (!lobby)
                            throw new Error("Lobby does not exist");
                        return [4 /*yield*/, cache.newGame(lobbyid)];
                    case 2:
                        game = _b.sent();
                        if (!game)
                            throw new Error("Unable to start game");
                        playerW = game.players.w;
                        playerWhiteSocketId = (_a = lobby.players.find(function (player) { return player.id === playerW; })) === null || _a === void 0 ? void 0 : _a.primaryClientSocketId;
                        if (!playerWhiteSocketId)
                            throw new Error("Conection mismatch");
                        nsp
                            .to(playerWhiteSocketId)
                            .timeout(30000)
                            .emit("game:request-move", 30000, function (err, response) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                console.log(response[0]);
                                nsp.to(lobbyid).emit;
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    }
    socket.on("game:move", function (_a, ack) {
        var move = _a.move, lobbyid = _a.lobbyid;
        return __awaiter(_this, void 0, void 0, function () {
            var moveRecievedISO, lobby, game, updatedGameData, updatedClock, updated;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        moveRecievedISO = (0, clockFunctions_1.currentISO)();
                        return [4 /*yield*/, cache.getLobbyById(lobbyid)];
                    case 1:
                        lobby = _b.sent();
                        if (!lobby)
                            throw new Error("Lobby does not exist");
                        game = lobby.currentGame;
                        if (game === null)
                            throw new Error("no active game");
                        if (!lobby.reservedConnections.some(function (id) { return id === socket.data.userid; }))
                            throw new Error("Player is not in lobby");
                        updatedGameData = Chess.move(game.data, move);
                        updatedClock = (0, clockFunctions_1.switchClock)(game.clock, moveRecievedISO, game.data.activeColor);
                        return [4 /*yield*/, cache.updateGame(lobbyid, __assign(__assign({}, game), { data: updatedGameData, clock: updatedClock }))];
                    case 2:
                        updated = _b.sent();
                        //Return the updated game data to the client and emit to the opponent
                        ack({ status: true, data: updated, error: null });
                        socket.to(lobbyid).emit("game:move", updated);
                        return [2 /*return*/];
                }
            });
        });
    });
}
exports.default = LobbyHandler;

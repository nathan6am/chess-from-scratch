"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var redisClientWrapper_1 = require("../util/redisClientWrapper");
function LobbyHandler(io, nsp, socket, redisClient) {
    var _this = this;
    var cache = (0, redisClientWrapper_1.wrapClient)(redisClient);
    socket.on("disconnect", function () {
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
                    //Start the game if both players are connected
                    ack({ status: true, data: lobby_1, error: null });
                    if (!(lobby_1.players.length === 2 && lobby_1.currentGame === null)) return [3 /*break*/, 4];
                    return [4 /*yield*/, cache.newGame(lobbyid)];
                case 3:
                    game = _a.sent();
                    console.log(game);
                    nsp.to(lobbyid).emit("game:new", game);
                    _a.label = 4;
                case 4: return [2 /*return*/];
                case 5:
                    ack({ status: false, error: new Error("Lobby is full") });
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    console.log(err_1);
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
}
exports.default = LobbyHandler;

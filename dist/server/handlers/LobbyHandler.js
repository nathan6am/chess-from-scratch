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
const redisClientWrapper_1 = require("../util/redisClientWrapper");
const Chess = __importStar(require("../../lib/chess"));
const clockFunctions_1 = require("../util/clockFunctions");
function LobbyHandler(io, nsp, socket, redisClient) {
    const cache = (0, redisClientWrapper_1.wrapClient)(redisClient);
    socket.on("disconnect", () => {
        //Find the active game if applicable and set a timeout for reconnection
        //or, abort the game if it has not yet started
        console.log(`Client ${socket.data.userid} has disconnected`);
    });
    socket.on("test:timeout", () => __awaiter(this, void 0, void 0, function* () {
        console.log("testing");
        socket.timeout(10000).emit("test:requestAck", "hello", (err, arg) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log(arg);
            }
        });
    }));
    /*
     *  Connects a player to a lobby, and starts the game if both players are
     *  connected
     * */
    socket.on("lobby:connect", (lobbyid, ack) => __awaiter(this, void 0, void 0, function* () {
        try {
            //Verify the user is authenticated and the lobby exists in the cache
            const userid = socket.data.userid;
            if (!userid)
                throw new Error("Unauthenticated");
            const lobby = yield cache.getLobbyById(lobbyid);
            if (!lobby)
                throw new Error("Lobby does not exist");
            if (lobby.reservedConnections.includes(userid) ||
                (lobby.reservedConnections.length < 2 && lobby.players.length < 2)) {
                //Add the player to the lobby cache and join the corresponding room
                const player = {
                    id: userid,
                    score: 0,
                    primaryClientSocketId: socket.id,
                };
                const lobby = yield cache.connectToLobby(lobbyid, player);
                socket.join(lobbyid);
                //Return the lobby to the client and start the game if both players are connected and
                ack({ status: true, data: lobby, error: null });
                if (lobby.players.length === 2 && lobby.currentGame === null) {
                    const game = yield cache.newGame(lobbyid);
                    nsp.to(lobbyid).emit("game:new", game);
                }
                return;
            }
            ack({ status: false, error: new Error("Lobby is full") });
        }
        catch (err) {
            //Log any errors and pass them in the response to the client
            console.error(err);
            if (err instanceof Error) {
                ack({ status: false, error: err });
            }
            else {
                ack({ status: false, error: new Error("Unable to connect to lobby") });
            }
        }
    }));
    const socketInstanceById = (socketId) => __awaiter(this, void 0, void 0, function* () {
        const sockets = yield io.in(socketId).fetchSockets();
        for (const socket of sockets) {
            if (socket.id === socketId)
                return socket;
        }
    });
    function startGame(lobbyid) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const lobby = yield cache.getLobbyById(lobbyid);
            if (!lobby)
                throw new Error("Lobby does not exist");
            const game = yield cache.newGame(lobbyid);
            if (!game)
                throw new Error("Unable to start game");
            const playerW = game.players.w;
            const playerWhiteSocketId = (_a = lobby.players.find((player) => player.id === playerW)) === null || _a === void 0 ? void 0 : _a.primaryClientSocketId;
            if (!playerWhiteSocketId)
                throw new Error("Conection mismatch");
            nsp
                .to(playerWhiteSocketId)
                .timeout(30000)
                .emit("game:request-move", 30000, (err, response) => {
                if (err) {
                    console.error(err);
                }
                else {
                    console.log(response[0]);
                    nsp.to(lobbyid).emit;
                }
            });
        });
    }
    socket.on("game:move", ({ move, lobbyid }, ack) => __awaiter(this, void 0, void 0, function* () {
        const moveRecievedISO = (0, clockFunctions_1.currentISO)();
        const lobby = yield cache.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("Lobby does not exist");
        const game = lobby.currentGame;
        if (game === null)
            throw new Error("no active game");
        if (!lobby.reservedConnections.some((id) => id === socket.data.userid))
            throw new Error("Player is not in lobby");
        //Execute the move
        const updatedGameData = Chess.move(game.data, move);
        //Update the clock state and apply increment
        const updatedClock = (0, clockFunctions_1.switchClock)(game.clock, moveRecievedISO, game.data.activeColor);
        const updated = yield cache.updateGame(lobbyid, Object.assign(Object.assign({}, game), { data: updatedGameData, clock: updatedClock }));
        //Return the updated game data to the client and emit to the opponent
        ack({ status: true, data: updated, error: null });
        socket.to(lobbyid).emit("game:move", updated);
    }));
}
exports.default = LobbyHandler;

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
const luxon_1 = require("luxon");
const misc_1 = require("../../util/misc");
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
                const player = {
                    id: userid,
                    score: 0,
                    primaryClientSocketId: socket.id,
                };
                //Check if the player was already connected from a previous client and notify any concurrent
                //clients of the same user
                const previousClient = lobby.players.find((existingPlayer) => existingPlayer.id === userid);
                if (previousClient) {
                    const clientToRemove = previousClient.primaryClientSocketId;
                    const clients = lobby.players
                        .map((player) => player.primaryClientSocketId)
                        .filter((socketId) => socketId !== clientToRemove);
                    clients.push(socket.id);
                    const inLobby = yield nsp.in(lobbyid).fetchSockets();
                    inLobby.forEach((socket) => {
                        if (!clients.includes(socket.id)) {
                            socket.leave(lobbyid);
                        }
                    });
                    socket.join(lobbyid);
                    nsp.to(userid).except(socket.id).emit("newclient");
                }
                //Update the cached lobby and add the socket to the room
                const updated = yield cache.connectToLobby(lobbyid, player);
                socket.join(lobbyid);
                if (updated.currentGame) {
                    const game = updated.currentGame;
                    const activeColor = game.data.activeColor;
                    const clock = game.clock;
                    //Correct the time remaining if both player have played a move
                    if (game.data.moveHistory.flat().filter(misc_1.notEmpty).length > 2 &&
                        clock.lastMoveTimeISO !== null) {
                        clock.timeRemainingMs[activeColor] = (0, clockFunctions_1.currentTimeRemaining)(clock.lastMoveTimeISO, clock.timeRemainingMs[activeColor]);
                        if (game.players[activeColor] !== userid) {
                            //Ack if the connected player is not the current turn
                            ack({ status: true, data: updated, error: null });
                            return;
                        }
                        else {
                            //Request move
                        }
                    }
                }
                //Return the lobby to the client and start the game if both players are connected and
                ack({ status: true, data: updated, error: null });
                if (updated.players.length === 2 && lobby.currentGame === null) {
                    console.log("starting");
                    startGame(lobbyid);
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
        const sockets = yield nsp.in(socketId).fetchSockets();
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
            const whiteSocket = yield socketInstanceById(playerWhiteSocketId);
            if (!whiteSocket) {
                //Abort the game
                return;
            }
            requestMoveWithTimeout(whiteSocket, game.clock.timeRemainingMs.w, game, lobbyid);
            nsp.to(lobbyid).emit("game:new", game);
        });
    }
    const requestMoveWithTimeout = (socket, timeoutMs, game, lobbyid) => __awaiter(this, void 0, void 0, function* () {
        const now = luxon_1.DateTime.now();
        const lobby = yield cache.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("lobby does not exist");
        if (!lobby.currentGame || lobby.currentGame.id !== game.id)
            throw new Error("game not found");
        //Correct the time remaining before emitting
        if (lobby.currentGame.clock.lastMoveTimeISO) {
            lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor] = (0, clockFunctions_1.currentTimeRemaining)(lobby.currentGame.clock.lastMoveTimeISO, lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor]);
        }
        socket
            .timeout(timeoutMs)
            .emit("game:request-move", timeoutMs, lobby.currentGame, (err, response) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (err) {
                const lobby = yield cache.getLobbyById(lobbyid);
                if (!lobby)
                    return;
                if (!lobby.currentGame)
                    return;
                //return if the game has an outcome or a new game has started
                if (((_a = lobby.currentGame) === null || _a === void 0 ? void 0 : _a.id) !== game.id ||
                    lobby.currentGame.data.outcome)
                    return;
                //return if moves have been played since the initial request
                if (lobby.currentGame.data.moveHistory.flat().length !==
                    game.data.moveHistory.flat().length)
                    return;
                //Set outcome by timeout and emit
                lobby.currentGame.data.outcome = {
                    result: lobby.currentGame.data.activeColor === "w" ? "b" : "w",
                    by: "timeout",
                };
                lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor] = 0;
                cache.updateGame(lobbyid, lobby.currentGame);
                nsp.to(lobbyid).emit("game:outcome", lobby.currentGame);
            }
            else {
                try {
                    console.log(response);
                    const updated = yield executeMove(response, lobbyid);
                    nsp.to(lobbyid).emit("game:move", updated);
                    const currentLobby = yield cache.getLobbyById(lobbyid);
                    if (!currentLobby)
                        return;
                    if (!currentLobby.currentGame)
                        return;
                    const nextPlayerId = currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor];
                    const nextPlayerSocketId = (_b = currentLobby.players.find((player) => player.id === nextPlayerId)) === null || _b === void 0 ? void 0 : _b.primaryClientSocketId;
                    if (!nextPlayerSocketId)
                        return;
                    const nextPlayerSocket = yield socketInstanceById(nextPlayerSocketId);
                    if (!nextPlayerSocket)
                        return;
                    const timeRemainingMs = (0, clockFunctions_1.currentTimeRemaining)(currentLobby.currentGame.clock.lastMoveTimeISO ||
                        luxon_1.DateTime.now().toISO(), currentLobby.currentGame.clock.timeRemainingMs[currentLobby.currentGame.data.activeColor]);
                    //Request move from next player
                    requestMoveWithTimeout(nextPlayerSocket, timeRemainingMs, currentLobby.currentGame, lobbyid);
                }
                catch (e) {
                    const lobby = yield cache.getLobbyById(lobbyid);
                    if (!lobby)
                        return;
                    if (!lobby.currentGame)
                        return;
                    //return if the game has an outcome or a new game has started
                    if (((_c = lobby.currentGame) === null || _c === void 0 ? void 0 : _c.id) !== game.id ||
                        lobby.currentGame.data.outcome)
                        return;
                    //return if moves have been played since the initial request
                    if (lobby.currentGame.data.moveHistory.flat().length !==
                        game.data.moveHistory.flat().length)
                        return;
                    const timeRemainingMs = (0, clockFunctions_1.currentTimeRemaining)(lobby.currentGame.clock.lastMoveTimeISO ||
                        luxon_1.DateTime.now().toISO(), lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor]);
                    //Rerequest with new timeout
                    requestMoveWithTimeout(socket, timeRemainingMs, game, lobbyid);
                }
            }
        }));
    });
    function executeMove(move, lobbyid) {
        return __awaiter(this, void 0, void 0, function* () {
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
            //Update the clocks if both players have played a move
            if (updatedGameData.fullMoveCount >= 2) {
                //Update the clock state and apply increment
                const updatedClock = (0, clockFunctions_1.switchClock)(game.clock, moveRecievedISO, game.data.activeColor);
                return yield cache.updateGame(lobbyid, Object.assign(Object.assign({}, game), { data: updatedGameData, clock: updatedClock }));
            }
            else {
                return yield cache.updateGame(lobbyid, Object.assign(Object.assign({}, game), { data: updatedGameData }));
            }
        });
    }
    socket.on("game:move", ({ move, lobbyid }, ack) => __awaiter(this, void 0, void 0, function* () {
        var _d;
        const updated = yield executeMove(move, lobbyid);
        //Return the updated game data to the client and emit to the opponent
        ack({ status: true, data: updated, error: null });
        socket.to(lobbyid).emit("game:move", updated);
        const currentLobby = yield cache.getLobbyById(lobbyid);
        if (!currentLobby)
            return;
        if (!currentLobby.currentGame)
            return;
        const nextPlayerId = currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor];
        const nextPlayerSocketId = (_d = currentLobby.players.find((player) => player.id === nextPlayerId)) === null || _d === void 0 ? void 0 : _d.primaryClientSocketId;
        if (!nextPlayerSocketId)
            return;
        const nextPlayerSocket = yield socketInstanceById(nextPlayerSocketId);
        if (!nextPlayerSocket)
            return;
        const timeRemainingMs = (0, clockFunctions_1.currentTimeRemaining)(currentLobby.currentGame.clock.lastMoveTimeISO || luxon_1.DateTime.now().toISO(), currentLobby.currentGame.clock.timeRemainingMs[currentLobby.currentGame.data.activeColor]);
        //Request move from next player
        requestMoveWithTimeout(nextPlayerSocket, timeRemainingMs, currentLobby.currentGame, lobbyid);
    }));
}
exports.default = LobbyHandler;

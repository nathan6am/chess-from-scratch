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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redisClientWrapper_1 = require("../util/redisClientWrapper");
const Game_1 = __importDefault(require("../../lib/db/entities/Game"));
const Chess = __importStar(require("../../lib/chess"));
const clockFunctions_1 = require("../util/clockFunctions");
const luxon_1 = require("luxon");
const misc_1 = require("../../util/misc");
const User_1 = __importDefault(require("../../lib/db/entities/User"));
function LobbyHandler(io, nsp, socket, redisClient) {
    const cache = (0, redisClientWrapper_1.wrapClient)(redisClient);
    //UTILITY FUNCTIONS
    //Retrieve a socket instance by its id
    const socketInstanceById = (socketId) => __awaiter(this, void 0, void 0, function* () {
        const sockets = yield nsp.in(socketId).fetchSockets();
        for (const socket of sockets) {
            if (socket.id === socketId)
                return socket;
        }
    });
    //Retrieve the socket instance for the next player to move in a lobby
    const getNextPlayerSocket = (lobbyid) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const currentLobby = yield cache.getLobbyById(lobbyid);
        if (!currentLobby)
            return;
        if (!currentLobby.currentGame)
            return;
        const nextPlayerId = currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor];
        const nextPlayerSocketId = (_a = currentLobby.players.find((player) => player.id === nextPlayerId)) === null || _a === void 0 ? void 0 : _a.primaryClientSocketId;
        if (!nextPlayerSocketId)
            return;
        const nextPlayerSocket = yield socketInstanceById(nextPlayerSocketId);
        return nextPlayerSocket;
    });
    //Start a game in a given lobby
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
            //Abort the game if the player is not connected
            if (!whiteSocket) {
                return;
            }
            requestMoveWithTimeout(whiteSocket, game.clock.timeRemainingMs.w, game, lobbyid);
            nsp.to(lobbyid).emit("game:new", game);
        });
    }
    //Handle game result
    function handleGameResult(lobbyid, game) {
        return __awaiter(this, void 0, void 0, function* () {
            const lobby = yield cache.getLobbyById(lobbyid);
            if (!lobby || !lobby.currentGame)
                return;
            const updated = yield cache.updateGame(lobbyid, game);
            const playerW = lobby.players.find((player) => player.id === game.players.w);
            const playerB = lobby.players.find((player) => player.id === game.players.b);
            if (!playerW || !playerB)
                throw new Error("player mismatch");
            const players = { w: playerW, b: playerB };
            console.log(players);
            const outcome = updated.data.outcome;
            if (!outcome)
                return;
            //update game scores
            if (outcome.result === "d") {
                lobby.players = lobby.players.map((player) => {
                    return Object.assign(Object.assign({}, player), { score: player.score + 0.5 });
                });
            }
            else {
                lobby.players = lobby.players.map((player) => {
                    if (outcome.result === "w" && player.id === playerW.id) {
                        return Object.assign(Object.assign({}, player), { score: player.score + 1 });
                    }
                    else if (outcome.result === "b" && player.id === playerB.id) {
                        return Object.assign(Object.assign({}, player), { score: player.score + 1 });
                    }
                    else
                        return player;
                });
            }
            yield cache.updateLobby(lobbyid, { players: lobby.players });
            const data = updated.data;
            const timeControl = updated.data.config.timeControls && updated.data.config.timeControls[0];
            nsp.to(lobbyid).emit("game:outcome", updated);
            nsp.to(lobbyid).emit("lobby:update", { players: lobby.players });
            //Save the game to db if any user is not a guest
            if (lobby.players.some((player) => player.user.type !== "guest")) {
                console.log(game.id);
                const saved = yield Game_1.default.saveGame(players, outcome, data, timeControl, game.id);
                console.log(saved);
            }
        });
    }
    socket.on("disconnect", () => {
        //Find the active game if applicable and set a timeout for reconnection
        //or, abort the game if it has not yet started
        console.log(`Client ${socket.data.userid} has disconnected`);
    });
    socket.on("lobby:connect", (lobbyid, ack) => __awaiter(this, void 0, void 0, function* () {
        try {
            //Verify the user is authenticated and the lobby exists in the cache
            const sessionUser = socket.data.sessionUser;
            if (!sessionUser)
                throw new Error("Unauthenticated");
            const { id, username, type } = sessionUser;
            const lobby = yield cache.getLobbyById(lobbyid);
            if (!lobby)
                throw new Error("Lobby does not exist");
            //Verify the user has permission to join the lobby or a free slot is available
            if (lobby.reservedConnections.includes(id) ||
                (lobby.reservedConnections.length < 2 && lobby.players.length < 2)) {
                let player;
                if (type !== "guest") {
                    //Get the user's current rating if the user is not a guest
                    const user = yield User_1.default.findOneBy({ id });
                    if (!user)
                        throw new Error("Unauthenticated");
                    console.log(user);
                    player = {
                        id,
                        username: username || "",
                        rating: user.rating,
                        score: 0,
                        primaryClientSocketId: socket.id,
                        user: sessionUser,
                    };
                }
                else {
                    player = {
                        id,
                        username: sessionUser.username || "",
                        score: 0,
                        primaryClientSocketId: socket.id,
                        user: sessionUser,
                    };
                }
                //Check if the player was already connected from a previous client and notify any concurrent
                //clients of the same user
                const previousClient = lobby.players.find((existingPlayer) => existingPlayer.id === id);
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
                    nsp.to(id).except(socket.id).emit("newclient");
                }
                //Update the cached lobby and add the socket to the room
                const updated = yield cache.connectToLobby(lobbyid, player);
                socket.join(lobbyid);
                if (updated.currentGame) {
                    if (updated.currentGame.data.outcome) {
                        ack({ status: true, data: updated, error: null });
                    }
                    else {
                        const game = updated.currentGame;
                        const activeColor = game.data.activeColor;
                        const clock = game.clock;
                        //Correct the time remaining if both player have played a move
                        if (game.data.moveHistory.flat().filter(misc_1.notEmpty).length > 2 &&
                            clock.lastMoveTimeISO !== null) {
                            clock.timeRemainingMs[activeColor] = (0, clockFunctions_1.currentTimeRemaining)(clock.lastMoveTimeISO, clock.timeRemainingMs[activeColor]);
                            if (game.players[activeColor] !== id) {
                                //Ack if the connected player is not the current turn
                                nsp.to(lobbyid).emit("lobby:update", {
                                    players: updated.players,
                                    reservedConnections: updated.reservedConnections,
                                });
                                ack({ status: true, data: updated, error: null });
                                return;
                            }
                            else {
                                //Request move
                            }
                        }
                    }
                }
                //Return the lobby to the client and start the game if both players are connected and
                ack({ status: true, data: updated, error: null });
                nsp.to(lobbyid).emit("lobby:update", {
                    players: updated.players,
                    reservedConnections: updated.reservedConnections,
                });
                if (updated.players.length === 2 && lobby.currentGame === null)
                    startGame(lobbyid);
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
    const requestMoveWithTimeout = (socket, timeoutMs, game, lobbyid) => __awaiter(this, void 0, void 0, function* () {
        const lobby = yield cache.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("lobby does not exist");
        if (!lobby.currentGame || lobby.currentGame.id !== game.id)
            throw new Error("game not found");
        //Correct the time remaining before emitting
        const clock = lobby.currentGame.clock;
        if (clock.lastMoveTimeISO) {
            lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor] =
                (0, clockFunctions_1.currentTimeRemaining)(clock.lastMoveTimeISO, clock.timeRemainingMs[lobby.currentGame.data.activeColor]);
        }
        //Timeout event to end the game if the user hasn't played a move in the allotted time
        socket
            .timeout(timeoutMs)
            .emit("game:request-move", timeoutMs, lobby.currentGame, (err, response) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c, _d;
            if (err) {
                const lobby = yield cache.getLobbyById(lobbyid);
                if (!lobby)
                    return;
                if (!lobby.currentGame)
                    return;
                //return if the game has an outcome or a new game has started
                if (((_b = lobby.currentGame) === null || _b === void 0 ? void 0 : _b.id) !== game.id || lobby.currentGame.data.outcome)
                    return;
                //return if moves have been played since the initial request
                if (lobby.currentGame.data.moveHistory.flat().length !== game.data.moveHistory.flat().length)
                    return;
                //Set outcome by timeout and emit
                //TODO: Check for insufficient material
                lobby.currentGame.data.outcome = {
                    result: lobby.currentGame.data.activeColor === "w" ? "b" : "w",
                    by: "timeout",
                };
                lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor] = 0;
                yield cache.updateGame(lobbyid, lobby.currentGame);
                yield handleGameResult(lobbyid, lobby.currentGame);
            }
            else {
                //Attempt to execute the move upon response from the client
                try {
                    const updated = yield executeMove(response, lobbyid);
                    nsp.to(lobbyid).emit("game:move", updated);
                    if (updated.data.outcome) {
                        yield handleGameResult(lobbyid, updated);
                        return;
                    }
                    const currentLobby = yield cache.getLobbyById(lobbyid);
                    //Retrieve the socket instance for the next player
                    if (!currentLobby)
                        return;
                    if (!currentLobby.currentGame)
                        return;
                    const nextPlayerId = currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor];
                    const nextPlayerSocketId = (_c = currentLobby.players.find((player) => player.id === nextPlayerId)) === null || _c === void 0 ? void 0 : _c.primaryClientSocketId;
                    if (!nextPlayerSocketId)
                        return;
                    const nextPlayerSocket = yield socketInstanceById(nextPlayerSocketId);
                    //TODO: set abandonment timeout
                    if (!nextPlayerSocket)
                        return;
                    const timeRemainingMs = (0, clockFunctions_1.currentTimeRemaining)(currentLobby.currentGame.clock.lastMoveTimeISO || luxon_1.DateTime.now().toISO(), currentLobby.currentGame.clock.timeRemainingMs[currentLobby.currentGame.data.activeColor]);
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
                    if (((_d = lobby.currentGame) === null || _d === void 0 ? void 0 : _d.id) !== game.id || lobby.currentGame.data.outcome)
                        return;
                    //return if moves have been played since the initial request
                    if (lobby.currentGame.data.moveHistory.flat().length !==
                        game.data.moveHistory.flat().length)
                        return;
                    const timeRemainingMs = (0, clockFunctions_1.currentTimeRemaining)(lobby.currentGame.clock.lastMoveTimeISO || luxon_1.DateTime.now().toISO(), lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor]);
                    //Rerequest with new timeout
                    requestMoveWithTimeout(socket, timeRemainingMs, game, lobbyid);
                }
            }
        }));
    });
    //Execute a move and updated the cached game state
    function executeMove(move, lobbyid) {
        return __awaiter(this, void 0, void 0, function* () {
            const moveRecievedISO = (0, clockFunctions_1.currentISO)();
            //Verify the lobby anf game still exist
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
        const updated = yield executeMove(move, lobbyid);
        //Return the updated game data to the client and emit to the opponent
        ack({ status: true, data: updated, error: null });
        socket.to(lobbyid).emit("game:move", updated);
        const currentLobby = yield cache.getLobbyById(lobbyid);
        if (!currentLobby || !currentLobby.currentGame)
            return;
        const nextPlayerSocket = yield getNextPlayerSocket(lobbyid);
        //TODO: timeout abandonment handler
        if (!nextPlayerSocket)
            return;
        //Get the current remaining time
        const timeRemainingMs = (0, clockFunctions_1.currentTimeRemaining)(currentLobby.currentGame.clock.lastMoveTimeISO || luxon_1.DateTime.now().toISO(), currentLobby.currentGame.clock.timeRemainingMs[currentLobby.currentGame.data.activeColor]);
        //Request move from next player
        requestMoveWithTimeout(nextPlayerSocket, timeRemainingMs, currentLobby.currentGame, lobbyid);
    }));
    socket.on("game:resign", (lobbyid) => __awaiter(this, void 0, void 0, function* () {
        const user = socket.data.sessionUser;
        const lobby = yield cache.getLobbyById(lobbyid);
        if (!lobby || !lobby.currentGame || lobby.currentGame.data.outcome || !user)
            return;
        if (!lobby.players.some((player) => player.id === user.id))
            return;
        const playerColor = lobby.currentGame.players.w === user.id ? "w" : "b";
        const game = lobby.currentGame;
        game.data.outcome = { result: playerColor === "w" ? "b" : "w", by: "resignation" };
        const updated = yield cache.updateGame(lobbyid, game);
        yield handleGameResult(lobbyid, game);
    }));
}
exports.default = LobbyHandler;

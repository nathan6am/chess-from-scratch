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
const glicko_1 = require("../util/glicko");
const pgnParser_1 = require("../../util/parsers/pgnParser");
function LobbyHandler(io, nsp, socket, redisClient) {
    const cache = (0, redisClientWrapper_1.wrapClient)(redisClient);
    //UTILITY FUNCTIONS
    //Retrieve a socket instance by its id
    const socketInstanceById = async (socketId) => {
        const sockets = await nsp.in(socketId).fetchSockets();
        for (const socket of sockets) {
            if (socket.id === socketId)
                return socket;
        }
    };
    //Retrieve the socket instance for the next player to move in a lobby
    const getNextPlayerSocket = async (lobbyid) => {
        const currentLobby = await cache.getLobbyById(lobbyid);
        if (!currentLobby)
            return;
        if (!currentLobby.currentGame)
            return;
        const nextPlayer = currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor];
        const nextPlayerConnection = currentLobby.connections.find((player) => player.id === nextPlayer.id);
        if (!nextPlayerConnection)
            return;
        const nextPlayerSocketId = nextPlayerConnection.lastClientSocketId;
        const nextPlayerSocket = await socketInstanceById(nextPlayerSocketId);
        return nextPlayerSocket;
    };
    //Start a game in a given lobby
    async function startGame(lobbyid) {
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("Lobby does not exist");
        const game = await cache.newGame(lobbyid);
        if (!game)
            throw new Error("Unable to start game");
        const playerW = game.players.w;
        const playerWhiteConnection = lobby.connections.find((player) => player.id === playerW.id);
        if (!playerWhiteConnection)
            throw new Error("Conection mismatch");
        const playerWhiteSocketId = playerWhiteConnection.lastClientSocketId;
        const whiteSocket = await socketInstanceById(playerWhiteSocketId);
        //Abort the game if the player is not connected
        if (!whiteSocket) {
            return;
        }
        requestMoveWithTimeout(whiteSocket, game.clock.timeRemainingMs.w, game, lobbyid);
        nsp.to(lobbyid).emit("game:new", game);
    }
    //Handle game result
    async function handleGameResult(lobbyid, game) {
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby || !lobby.currentGame)
            return;
        const updated = await cache.updateGame(lobbyid, game);
        const connectionWhite = lobby.connections.find((connection) => connection.id === game.players.w.id);
        const connectionBlack = lobby.connections.find((connection) => connection.id === game.players.b.id);
        if (!connectionBlack || !connectionWhite)
            throw new Error("connections mismatched");
        const connections = { w: connectionWhite, b: connectionBlack };
        const outcome = updated.data.outcome;
        if (!outcome)
            return;
        //update game scores
        if (outcome.result === "d") {
            lobby.connections = lobby.connections.map((connection) => {
                return { ...connection, score: connection.score + 0.5 };
            });
        }
        else {
            lobby.connections = lobby.connections.map((connection) => {
                if (outcome.result === "w" && connection.id === connectionWhite.id) {
                    return {
                        ...connection,
                        score: connection.score + 1,
                    };
                }
                else if (outcome.result === "b" && connection.id === connectionBlack.id) {
                    return {
                        ...connection,
                        score: connection.score + 1,
                    };
                }
                else
                    return connection;
            });
        }
        let ratingDeltas = { w: 0, b: 0 };
        //update user ratings if applicable
        if (lobby.connections.every((connection) => connection.player.type !== "guest") && lobby.options.rated) {
            const playerw = await User_1.default.findOneBy({ id: connectionWhite.player.id });
            const playerb = await User_1.default.findOneBy({ id: connectionBlack.player.id });
            if (!playerw || !playerb)
                throw new Error("User not found");
            const ratingCategory = Chess.inferRatingCategeory(lobby.options.gameConfig.timeControl || null);
            const ratingw = playerw.ratings[ratingCategory];
            const ratingb = playerb.ratings[ratingCategory];
            const result = outcome.result === "w" ? 1 : outcome.result === "b" ? 0 : 0.5;
            const [newRatingW, newRatingB] = (0, glicko_1.updateRatings)(ratingw, ratingb, result);
            await User_1.default.updateRatings(ratingCategory, [
                { id: playerw.id, newRating: newRatingW },
                { id: playerb.id, newRating: newRatingB },
            ]);
            ratingDeltas = {
                w: newRatingW.rating - ratingw.rating,
                b: newRatingB.rating - ratingb.rating,
            };
            //Update the connection objects with the new ratings
            lobby.connections = lobby.connections.map((connection) => {
                if (connection.id === connectionWhite.id) {
                    return {
                        ...connection,
                        player: {
                            ...connection.player,
                            rating: newRatingW.rating,
                        },
                    };
                }
                else if (connection.id === connectionBlack.id) {
                    return {
                        ...connection,
                        player: {
                            ...connection.player,
                            rating: newRatingB.rating,
                        },
                    };
                }
                return connection;
            });
        }
        await cache.updateLobby(lobbyid, { connections: lobby.connections });
        const data = updated.data;
        const timeControl = updated.data.config.timeControl || null;
        const players = {
            w: connections.w.player,
            b: connections.b.player,
        };
        nsp.to(lobbyid).emit("game:outcome", updated);
        nsp.to(lobbyid).emit("lobby:update", { connections: lobby.connections });
        //Save the game to db if any user is not a guest
        if (lobby.connections.some((connection) => connection.player.type !== "guest")) {
            //console.log(game.id);
            const pgn = (0, pgnParser_1.encodeGameToPgn)(updated);
            const saved = await Game_1.default.saveGame(players, outcome, data, timeControl, pgn, game.id);
            //console.log(saved);
        }
    }
    socket.on("lobby:connect", async (lobbyid, ack) => {
        try {
            console.log(`Client ${socket.data.userid} connecting to lobby ${lobbyid}`);
            //Verify the user is authenticated and the lobby exists in the cache
            const sessionUser = socket.data.sessionUser;
            if (!sessionUser)
                throw new Error("Unauthenticated");
            const { id, username, type } = sessionUser;
            const lobby = await cache.getLobbyById(lobbyid);
            if (!lobby)
                throw new Error("Lobby does not exist");
            //Verify the user has permission to join the lobby or a free slot is available
            if (lobby.reservedConnections.includes(id) ||
                (lobby.reservedConnections.length < 2 && lobby.connections.length < 2)) {
                let connection;
                if (type !== "guest") {
                    //Get the user's current rating if the user is not a guest
                    const user = await User_1.default.findById(id);
                    //console.log(id);
                    if (!user)
                        throw new Error("Unauthenticated");
                    const timeControl = lobby.options.gameConfig.timeControl;
                    const ratingCategory = Chess.inferRatingCategeory(timeControl || null);
                    //console.log(user);
                    connection = {
                        id,
                        player: {
                            ...sessionUser,
                            rating: user.ratings[ratingCategory].rating,
                        },
                        score: 0,
                        lastClientSocketId: socket.id,
                        connectionStatus: true,
                    };
                }
                else {
                    connection = {
                        id,
                        player: sessionUser,
                        score: 0,
                        lastClientSocketId: socket.id,
                        connectionStatus: true,
                    };
                }
                //Check if the player was already connected from a previous client and notify any concurrent
                //clients of the same user
                const previousClient = lobby.connections.find((existingConn) => existingConn.id === id);
                if (previousClient) {
                    const clientToRemove = previousClient.lastClientSocketId;
                    const clients = lobby.connections
                        .map((conn) => conn.lastClientSocketId)
                        .filter((socketId) => socketId !== clientToRemove);
                    clients.push(socket.id);
                    const inLobby = await nsp.in(lobbyid).fetchSockets();
                    inLobby.forEach((socket) => {
                        if (!clients.includes(socket.id)) {
                            socket.leave(lobbyid);
                        }
                    });
                    socket.join(lobbyid);
                    nsp.to(id).except(socket.id).emit("newclient");
                }
                //Update the cached lobby and add the socket to the room
                const updated = await cache.connectToLobby(lobbyid, connection);
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
                        if (game.data.moveHistory.flat().filter(misc_1.notEmpty).length > 2 && clock.lastMoveTimeISO !== null) {
                            clock.timeRemainingMs[activeColor] = (0, clockFunctions_1.currentTimeRemaining)(clock.lastMoveTimeISO, clock.timeRemainingMs[activeColor]);
                            if (game.players[activeColor].id !== id) {
                                //Ack if the connected player is not the current turn
                                nsp.to(lobbyid).emit("lobby:update", {
                                    connections: updated.connections,
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
                    connections: updated.connections,
                    reservedConnections: updated.reservedConnections,
                });
                if (updated.connections.length === 2 && lobby.currentGame === null)
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
    });
    socket.on("lobby:request-rematch", async (lobbyid) => {
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby)
            return;
        if (!lobby.currentGame)
            return;
        const user = socket.data.sessionUser;
        if (!user)
            return;
        if (!lobby.connections.some((connection) => connection.id === user.id))
            return;
        const playerColor = lobby.currentGame.players.w.id === user.id ? "w" : "b";
        const opponentColor = playerColor === "w" ? "b" : "w";
        lobby.rematchRequested[playerColor] = true;
        if (lobby.rematchRequested[opponentColor] === false) {
            //If the opponent has declined the rematch, return the declined event and abort
            nsp.to(socket.id).emit("lobby:rematch-declined", lobby.rematchRequested);
            return;
        }
        await cache.updateLobby(lobbyid, lobby);
        socket.to(lobbyid).emit("lobby:rematch-requested", lobby.rematchRequested);
        if (lobby.rematchRequested.w && lobby.rematchRequested.b) {
            await cache.newGame(lobbyid);
            startGame(lobbyid);
        }
    });
    socket.on("lobby:accept-rematch", async (lobbyid, accpeted) => {
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby)
            return;
        if (!lobby.currentGame)
            return;
        const user = socket.data.sessionUser;
        if (!user)
            return;
        if (!lobby.connections.some((connection) => connection.id === user.id))
            return;
        const playerColor = lobby.currentGame.players.w.id === user.id ? "w" : "b";
        const opponentColor = playerColor === "w" ? "b" : "w";
        if (accpeted) {
            lobby.rematchRequested[playerColor] = true;
            if (lobby.rematchRequested[opponentColor] === false) {
                //If the opponent has declined the rematch, return the declined event and abort
                nsp.to(socket.id).emit("lobby:rematch-declined", lobby.rematchRequested);
                return;
            }
            if (lobby.rematchRequested.w && lobby.rematchRequested.b) {
                await cache.newGame(lobbyid);
                startGame(lobbyid);
            }
        }
        else {
            lobby.rematchRequested[playerColor] = false;
            socket.to(lobbyid).emit("lobby:rematch-declined", lobby.rematchRequested);
        }
    });
    socket.on("disconnect", async () => {
        if (!socket.data.userid)
            return;
        const lobbies = Array.from(socket.rooms).filter((room) => room !== socket.id);
        for (const lobbyid of lobbies) {
            const lobby = await cache.getLobbyById(lobbyid);
            if (!lobby)
                return;
            const lastDisconnectISO = new Date().toISOString();
            const updated = await cache.disconnectFromLobby(lobbyid, {
                userid: socket.data.userid,
                socketid: socket.id,
                timestampISO: lastDisconnectISO,
            });
            if (!updated)
                return;
            console.log(updated.connections);
            nsp.to(lobbyid).emit("lobby:update", {
                connections: updated.connections,
                reservedConnections: updated.reservedConnections,
            });
            if (lobby.currentGame && !lobby.currentGame.data.outcome) {
                const ratingCategory = Chess.inferRatingCategeory(lobby.options.gameConfig.timeControl || null);
                const abandonTimeoutMap = {
                    bullet: 15 * 1000,
                    blitz: 45 * 1000,
                    rapid: 2 * 60 * 1000,
                    classical: 5 * 60 * 1000,
                    puzzle: 0,
                    correspondence: 0,
                };
                const abandonTimeout = abandonTimeoutMap[ratingCategory];
                if (abandonTimeout === 0)
                    return;
                const timer = setTimeout(async () => {
                    const lobby = await cache.getLobbyById(lobbyid);
                    if (!lobby)
                        return;
                    if (!lobby.currentGame)
                        return;
                    if (lobby.currentGame.data.outcome)
                        return;
                    const connections = lobby.connections;
                    const connection = connections.find((connection) => connection.id === socket.data.userid);
                    if (!connection)
                        return;
                    if (connection.lastDisconnect !== lastDisconnectISO)
                        return;
                    const playerColor = lobby.currentGame.players.w.id === socket.data.userid ? "w" : "b";
                    const game = lobby.currentGame;
                    game.data.outcome = { result: playerColor === "w" ? "b" : "w", by: "abandonment" };
                    const updated = await cache.updateGame(lobbyid, game);
                    await handleGameResult(lobbyid, game);
                }, abandonTimeout);
            }
        }
    });
    const requestMoveWithTimeout = async (socket, timeoutMs, game, lobbyid) => {
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("lobby does not exist");
        if (!lobby.currentGame || lobby.currentGame.id !== game.id)
            throw new Error("game not found");
        //Correct the time remaining before emitting
        const clock = lobby.currentGame.clock;
        if (clock.lastMoveTimeISO) {
            lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor] = (0, clockFunctions_1.currentTimeRemaining)(clock.lastMoveTimeISO, clock.timeRemainingMs[lobby.currentGame.data.activeColor]);
        }
        //Timeout event to end the game if the user hasn't played a move in the allotted time
        socket.timeout(timeoutMs).emit("game:request-move", timeoutMs, lobby.currentGame, async (err, response) => {
            if (err) {
                const lobby = await cache.getLobbyById(lobbyid);
                if (!lobby)
                    return;
                if (!lobby.currentGame)
                    return;
                //return if the game has an outcome or a new game has started
                if (lobby.currentGame?.id !== game.id || lobby.currentGame.data.outcome)
                    return;
                //return if moves have been played since the initial request
                if (lobby.currentGame.data.moveHistory.flat().length !== game.data.moveHistory.flat().length)
                    return;
                //Set outcome by timeout and emit
                const board = lobby.currentGame.data.board;
                const pieces = {
                    w: board.filter(([square, piece]) => piece.color === "w").map(([square, piece]) => piece),
                    b: board.filter(([square, piece]) => piece.color === "b").map(([square, piece]) => piece),
                };
                const nextColor = lobby.currentGame.data.activeColor === "w" ? "b" : "w";
                if (Chess.isSufficientMaterial(pieces[nextColor])) {
                    lobby.currentGame.data.outcome = {
                        result: nextColor,
                        by: "timeout",
                    };
                }
                else {
                    lobby.currentGame.data.outcome = {
                        result: "d",
                        by: "timeout-w-insufficient",
                    };
                }
                lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor] = 0;
                await cache.updateGame(lobbyid, lobby.currentGame);
                await handleGameResult(lobbyid, lobby.currentGame);
            }
            else {
                //Attempt to execute the move upon response from the client
                try {
                    const updated = await executeMove(response, lobbyid);
                    nsp.to(lobbyid).emit("game:move", updated);
                    if (updated.data.outcome) {
                        await handleGameResult(lobbyid, updated);
                        return;
                    }
                    const currentLobby = await cache.getLobbyById(lobbyid);
                    //Retrieve the socket instance for the next player
                    if (!currentLobby)
                        return;
                    if (!currentLobby.currentGame)
                        return;
                    const nextPlayerId = currentLobby.currentGame.players[currentLobby.currentGame.data.activeColor].id;
                    const nextPlayerConnection = currentLobby.connections.find((player) => player.id === nextPlayerId);
                    if (!nextPlayerConnection)
                        return;
                    const nextPlayerSocketId = nextPlayerConnection.lastClientSocketId;
                    const nextPlayerSocket = await socketInstanceById(nextPlayerSocketId);
                    //TODO: set abandonment timeout
                    if (!nextPlayerSocket)
                        return;
                    const timeRemainingMs = (0, clockFunctions_1.currentTimeRemaining)(currentLobby.currentGame.clock.lastMoveTimeISO || luxon_1.DateTime.now().toISO(), currentLobby.currentGame.clock.timeRemainingMs[currentLobby.currentGame.data.activeColor]);
                    //Request move from next player
                    requestMoveWithTimeout(nextPlayerSocket, timeRemainingMs, currentLobby.currentGame, lobbyid);
                }
                catch (e) {
                    const lobby = await cache.getLobbyById(lobbyid);
                    if (!lobby)
                        return;
                    if (!lobby.currentGame)
                        return;
                    //return if the game has an outcome or a new game has started
                    if (lobby.currentGame?.id !== game.id || lobby.currentGame.data.outcome)
                        return;
                    //return if moves have been played since the initial request
                    if (lobby.currentGame.data.moveHistory.flat().length !== game.data.moveHistory.flat().length)
                        return;
                    const timeRemainingMs = (0, clockFunctions_1.currentTimeRemaining)(lobby.currentGame.clock.lastMoveTimeISO || luxon_1.DateTime.now().toISO(), lobby.currentGame.clock.timeRemainingMs[lobby.currentGame.data.activeColor]);
                    //Rerequest with new timeout
                    requestMoveWithTimeout(socket, timeRemainingMs, game, lobbyid);
                }
            }
        });
    };
    //Execute a move and updated the cached game state
    async function executeMove(move, lobbyid) {
        const moveRecievedISO = (0, clockFunctions_1.currentISO)();
        //Verify the lobby anf game still exist
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby)
            throw new Error("Lobby does not exist");
        const game = lobby.currentGame;
        if (game === null)
            throw new Error("no active game");
        if (!lobby.reservedConnections.some((id) => id === socket.data.userid))
            throw new Error("Player is not in lobby");
        //Execute the move
        const updatedClock = (0, clockFunctions_1.switchClock)(game.clock, moveRecievedISO, game.data.activeColor);
        const updatedGameData = Chess.move(game.data, move, updatedClock.timeRemainingMs[game.data.activeColor]);
        //Clear the draw offer if the player who offred the draw has moved
        if (game.drawOffered === game.data.activeColor) {
            game.drawOffered = undefined;
        }
        //Update the clocks if both players have played a move
        if (updatedGameData.fullMoveCount >= 2) {
            //Update the clock state and apply increment
            return await cache.updateGame(lobbyid, {
                ...game,
                data: updatedGameData,
                clock: updatedClock,
            });
        }
        else {
            return await cache.updateGame(lobbyid, {
                ...game,
                data: updatedGameData,
            });
        }
    }
    socket.on("game:move", async ({ move, lobbyid }, ack) => {
        const updated = await executeMove(move, lobbyid);
        //Return the updated game data to the client and emit to the opponent
        ack({ status: true, data: updated, error: null });
        socket.to(lobbyid).emit("game:move", updated);
        const currentLobby = await cache.getLobbyById(lobbyid);
        if (!currentLobby || !currentLobby.currentGame)
            return;
        const nextPlayerSocket = await getNextPlayerSocket(lobbyid);
        //TODO: timeout abandonment handler
        if (!nextPlayerSocket)
            return;
        //Get the current remaining time
        const timeRemainingMs = (0, clockFunctions_1.currentTimeRemaining)(currentLobby.currentGame.clock.lastMoveTimeISO || luxon_1.DateTime.now().toISO(), currentLobby.currentGame.clock.timeRemainingMs[currentLobby.currentGame.data.activeColor]);
        //Request move from next player
        requestMoveWithTimeout(nextPlayerSocket, timeRemainingMs, currentLobby.currentGame, lobbyid);
    });
    socket.on("game:resign", async (lobbyid) => {
        const user = socket.data.sessionUser;
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby || !lobby.currentGame || lobby.currentGame.data.outcome || !user)
            return;
        if (!lobby.connections.some((player) => player.id === user.id))
            return;
        const playerColor = lobby.currentGame.players.w.id === user.id ? "w" : "b";
        const game = lobby.currentGame;
        game.data.outcome = { result: playerColor === "w" ? "b" : "w", by: "resignation" };
        const updated = await cache.updateGame(lobbyid, game);
        await handleGameResult(lobbyid, game);
    });
    socket.on("game:offer-draw", async (lobbyid) => {
        const user = socket.data.sessionUser;
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby || !lobby.currentGame || lobby.currentGame.data.outcome || !user)
            return;
        if (!lobby.connections.some((player) => player.id === user.id))
            return;
        const playerColor = lobby.currentGame.players.w.id === user.id ? "w" : "b";
        const game = lobby.currentGame;
        if (game.drawOffered && game.drawOffered !== playerColor) {
            //Accept the draw if the other player has offered
            game.data.outcome = { result: "d", by: "agreement" };
            const updated = await cache.updateGame(lobbyid, game);
            if (!updated)
                throw new Error("Unable to update game");
            await handleGameResult(lobbyid, game);
        }
        else {
            const updated = await cache.updateGame(lobbyid, {
                ...game,
                drawOffered: playerColor,
            });
            nsp.to(lobbyid).emit("game:draw-offered", playerColor);
        }
    });
    socket.on("game:accept-draw", async (lobbyid, accepted) => {
        const user = socket.data.sessionUser;
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby || !lobby.currentGame || lobby.currentGame.data.outcome || !user)
            return;
        if (!lobby.connections.some((player) => player.id === user.id))
            return;
        const playerColor = lobby.currentGame.players.w.id === user.id ? "w" : "b";
        const game = lobby.currentGame;
        if (!game.drawOffered || game.drawOffered === playerColor)
            return;
        if (accepted) {
            game.data.outcome = { result: "d", by: "agreement" };
            const updated = await cache.updateGame(lobbyid, game);
            if (!updated)
                throw new Error("Unable to update game");
            await handleGameResult(lobbyid, game);
        }
        else {
            const updated = await cache.updateGame(lobbyid, {
                ...game,
                drawOffered: undefined,
            });
            nsp.to(lobbyid).emit("game:draw-declined");
        }
    });
    socket.on("lobby:chat", async ({ message, lobbyid }, ack) => {
        const user = socket.data.sessionUser;
        const lobby = await cache.getLobbyById(lobbyid);
        if (!lobby || !lobby.currentGame || lobby.currentGame.data.outcome || !user)
            return;
        if (!lobby.connections.some((player) => player.id === user.id))
            return;
        const messageObject = {
            timestampISO: new Date().toISOString(),
            author: {
                id: user.id || "",
                username: user.username || "",
            },
            message: message,
        };
        const chat = [...lobby.chat, messageObject];
        await cache.updateLobby(lobbyid, { chat });
        ack({
            status: true,
            data: chat,
            error: null,
        });
        socket.to(lobbyid).emit("lobby:chat", chat);
    });
}
exports.default = LobbyHandler;

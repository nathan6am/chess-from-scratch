"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redisClientWrapper_1 = require("../util/redisClientWrapper");
//Utils
const nanoid_1 = require("nanoid");
const nanoid = (0, nanoid_1.customAlphabet)("abcdefghijklmnopqrstuvwxyz", 7);
function default_1(io, socket, redisClient) {
    const cache = (0, redisClientWrapper_1.wrapClient)(redisClient);
    socket.on("authenticate", async (ack) => {
        if (!socket.data.userid) {
            ack(false);
            return;
        }
        //Leave all rooms
        const rooms = socket.rooms;
        rooms.forEach((room) => {
            if (room && room !== socket.id)
                socket.leave(room);
        });
        //Join room for all connections of the same user - allows broadcasting events to all sessions
        //for example to disable game if active on another conection
        socket.join(socket.data.userid);
        ack(true);
    });
    socket.on("lobby:create", async (options, ack) => {
        const userid = socket.data.userid;
        if (!userid) {
            console.log("unauthenticated");
            ack({ status: false, error: new Error("Unauthenticated") });
            return;
        }
        const lobby = {
            id: nanoid(7),
            creatorId: userid,
            reservedConnections: [userid],
            currentGame: null,
            connections: [],
            options: {
                rated: false,
                gameConfig: options.gameConfig || {
                    startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    timeControl: { timeSeconds: 300, incrementSeconds: 5 },
                },
                color: "random",
                ...options,
            },
            rematchRequested: { w: null, b: null },
            chat: [],
        };
        try {
            const created = await cache.newLobby(lobby);
            ack({ status: true, data: created, error: null });
            return;
        }
        catch (err) {
            if (err instanceof Error) {
                ack({ status: false, error: err });
                return;
            }
            else {
                ack({ status: false, error: new Error("Error creating lobby") });
                return;
            }
        }
    });
}
exports.default = default_1;

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
Object.defineProperty(exports, "__esModule", { value: true });
const nanoid_1 = require("nanoid");
const redisClientWrapper_1 = require("../util/redisClientWrapper");
function default_1(io, socket, redisClient) {
    const cache = (0, redisClientWrapper_1.wrapClient)(redisClient);
    socket.on("authenticate", (ack) => __awaiter(this, void 0, void 0, function* () {
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
    }));
    socket.on("lobby:create", (options, ack) => __awaiter(this, void 0, void 0, function* () {
        const userid = socket.data.userid;
        if (!userid) {
            console.log("unauthenticated");
            ack({ status: false, error: new Error("Unauthenticated") });
            return;
        }
        const lobby = {
            id: (0, nanoid_1.nanoid)(10),
            creator: userid,
            reservedConnections: [userid],
            currentGame: null,
            players: [],
            options: Object.assign({ rated: false, gameConfig: {
                    startPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    timeControls: [{ timeSeconds: 300, incrementSeconds: 5 }],
                }, color: "random" }, options),
            chat: [],
        };
        try {
            const created = yield cache.newLobby(lobby);
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
    }));
}
exports.default = default_1;

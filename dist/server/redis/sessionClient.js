"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var redis_1 = require("redis");
var redisClient = (0, redis_1.createClient)({ legacyMode: true });
redisClient
    .connect()
    .then(function () {
    console.log("Connected to redis client");
})
    .catch(console.error);
exports.default = redisClient;

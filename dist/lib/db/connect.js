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
exports.initialize = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const User_1 = __importStar(require("./entities/User"));
const Game_1 = __importDefault(require("./entities/Game"));
const Puzzle_1 = __importDefault(require("./entities/Puzzle"));
const User_Game_1 = __importDefault(require("./entities/User_Game"));
const Analysis_1 = __importDefault(require("./entities/Analysis"));
const Collection_1 = __importDefault(require("./entities/Collection"));
const env_1 = require("@next/env");
(0, env_1.loadEnvConfig)("./", process.env.NODE_ENV !== "production");
const username = process.env.DB_USERNAME || "";
const port = parseInt(process.env.DB_PORT || "5432");
const password = process.env.DB_PASSWORD || "";
const host = process.env.DB_HOST || "";
const database = process.env.DB_NAME || "";
async function initialize() {
    const datasource = new typeorm_1.DataSource({
        type: "postgres",
        username,
        port,
        password,
        database,
        host,
        entities: [User_1.default, Game_1.default, Puzzle_1.default, Analysis_1.default, User_1.Notification, User_Game_1.default, User_1.Credential, Collection_1.default, User_1.Profile],
        synchronize: true,
    });
    await datasource.initialize();
}
exports.initialize = initialize;

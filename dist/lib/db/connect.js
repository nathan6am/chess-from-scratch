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
exports.initialize = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const user_1 = require("./entities/user");
const env_1 = require("@next/env");
(0, env_1.loadEnvConfig)("./", process.env.NODE_ENV !== "production");
const username = process.env.DB_USERNAME || "";
const port = parseInt(process.env.DB_PORT || "5432");
const password = process.env.DB_PASSWORD || "";
const host = process.env.DB_HOST || "";
const database = process.env.DB_NAME || "";
function initialize() {
    return __awaiter(this, void 0, void 0, function* () {
        const datasource = new typeorm_1.DataSource({
            type: "postgres",
            username,
            port,
            password,
            database,
            host,
            entities: [
                user_1.User,
                user_1.Game,
                user_1.Puzzle,
                user_1.Analysis,
                user_1.Notification,
                user_1.User_Game,
                user_1.Credential,
            ],
            synchronize: true,
        });
        yield datasource.initialize();
    });
}
exports.initialize = initialize;

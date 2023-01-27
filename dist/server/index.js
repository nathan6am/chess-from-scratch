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
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const db = __importStar(require("../lib/db/connect"));
const env_1 = require("@next/env");
(0, env_1.loadEnvConfig)("./", process.env.NODE_ENV !== "production");
const http = __importStar(require("http"));
const next_1 = __importDefault(require("next"));
const socketio = __importStar(require("socket.io"));
const connect_redis_1 = __importDefault(require("connect-redis"));
let RedisStore = (0, connect_redis_1.default)(express_session_1.default);
const passport_1 = __importDefault(require("passport"));
const auth_1 = __importDefault(require("./routes/auth"));
const MainHandler_1 = __importDefault(require("./handlers/MainHandler"));
const redis_1 = require("redis");
const user_1 = __importDefault(require("./routes/user"));
const redisClient = (0, redis_1.createClient)();
const sessionClient = (0, redis_1.createClient)({ legacyMode: true });
const cors_1 = __importDefault(require("cors"));
const LobbyHandler_1 = __importDefault(require("./handlers/LobbyHandler"));
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
console.log(`Environment: ${process.env.NODE_ENV}`);
const dev = process.env.NODE_ENV !== "production";
const nextApp = (0, next_1.default)({ dev, hostname, port });
const nextHandler = nextApp.getRequestHandler();
nextApp.prepare().then(() => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_1.default)();
    const server = http.createServer(app);
    yield sessionClient.connect();
    console.log("Connected to session client");
    yield redisClient.connect();
    console.log("Connected to redis client");
    yield db.initialize();
    console.log("Connected to database");
    const sessionMiddleware = (0, express_session_1.default)({
        secret: process.env.SESSION_SECRET || "keyboard cat",
        store: new RedisStore({ client: sessionClient }),
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: true,
            secure: dev ? false : "auto",
            sameSite: dev ? "lax" : "strict",
            maxAge: 1000 * 60 * 60 * 24 * 365,
        },
    });
    //Cross origin isolate for shared-array-buffer
    //app.use(express.static(path.join(__dirname, "build"), { dotfiles: "allow" }));
    app.use(express_1.default.json());
    app.use((req, res, next) => {
        res.header("Cross-Origin-Embedder-Policy", "require-corp");
        res.header("Cross-Origin-Opener-Policy", "same-origin");
        res.header("Cross-Origin-Resource-Policy", "cross-origin");
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "*");
        next();
    });
    app.use((0, cors_1.default)({ origin: process.env.BASE_URL }));
    app.use(sessionMiddleware);
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    app.use(passport_1.default.authenticate("session"));
    app.use("/api/auth", auth_1.default);
    app.use("/api/user", user_1.default);
    //Wrap middleware for socket.io
    const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
    const io = new socketio.Server(server, {
        cors: {
            origin: process.env.BASE_URL,
            methods: ["GET", "POST"],
        },
    });
    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });
    io.use(wrap(passport_1.default.initialize()));
    io.use(wrap(passport_1.default.session()));
    io.use((socket, next) => {
        var _a, _b;
        const passportUser = (_b = (_a = socket.request.session) === null || _a === void 0 ? void 0 : _a.passport) === null || _b === void 0 ? void 0 : _b.user;
        if (passportUser) {
            const user = JSON.parse(passportUser);
            socket.data.user = user;
            socket.data.userid = user.id;
        }
        next();
    });
    const lobbyNsp = io.of("/lobby");
    lobbyNsp.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });
    lobbyNsp.use(wrap(passport_1.default.initialize()));
    lobbyNsp.use(wrap(passport_1.default.session()));
    lobbyNsp.use((socket, next) => {
        var _a, _b;
        const passportUser = (_b = (_a = socket.request.session) === null || _a === void 0 ? void 0 : _a.passport) === null || _b === void 0 ? void 0 : _b.user;
        if (passportUser) {
            const user = JSON.parse(passportUser);
            socket.data.user = user;
            socket.data.userid = user.id;
        }
        next();
    });
    lobbyNsp.on("connection", (socket) => {
        (0, LobbyHandler_1.default)(io, lobbyNsp, socket, redisClient);
        socket.on("disconnect", () => {
            console.log("client disconnected from lobby nsp");
        });
    });
    io.on("connection", (socket) => {
        (0, MainHandler_1.default)(io, socket, redisClient);
        socket.on("disconnect", () => {
            console.log("client disconnected");
        });
    });
    app.all("*", (req, res) => nextHandler(req, res));
    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
}));

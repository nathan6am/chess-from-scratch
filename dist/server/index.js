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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var express_session_1 = __importDefault(require("express-session"));
//Load environment variables before starting the custom server
var env_1 = require("@next/env");
(0, env_1.loadEnvConfig)("./", process.env.NODE_ENV !== "production");
var http = __importStar(require("http"));
var next_1 = __importDefault(require("next"));
var socketio = __importStar(require("socket.io"));
var sessionClient_1 = __importDefault(require("./redis/sessionClient"));
var connect_redis_1 = __importDefault(require("connect-redis"));
var RedisStore = (0, connect_redis_1.default)(express_session_1.default);
var passport_1 = __importDefault(require("passport"));
var auth_1 = __importDefault(require("./routes/auth"));
var cors_1 = __importDefault(require("cors"));
var hostname = process.env.HOSTNAME || "localhost";
var port = parseInt(process.env.PORT || "3000", 10);
console.log(process.env.NODE_ENV);
var dev = process.env.NODE_ENV !== "production";
console.log(dev);
var nextApp = (0, next_1.default)({ dev: dev, hostname: hostname, port: port });
var nextHandler = nextApp.getRequestHandler();
var sessionMiddleware = (0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    store: new RedisStore({ client: sessionClient_1.default }),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
});
nextApp.prepare().then(function () { return __awaiter(void 0, void 0, void 0, function () {
    var app, server, io, wrap;
    return __generator(this, function (_a) {
        app = (0, express_1.default)();
        server = http.createServer(app);
        io = new socketio.Server();
        io.attach(server);
        //Cross origin isoalte for workers
        app.use(function (req, res, next) {
            res.header("Cross-Origin-Embedder-Policy", "require-corp");
            res.header("Cross-Origin-Opener-Policy", "same-origin");
            res.header("Cross-Origin-Resource-Policy", "cross-origin");
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "*");
            next();
        });
        app.use((0, cors_1.default)());
        app.use(sessionMiddleware);
        app.use(passport_1.default.initialize());
        app.use(passport_1.default.session());
        app.use(passport_1.default.authenticate("session"));
        app.get("/hello", function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                res.send("Hello World");
                return [2 /*return*/];
            });
        }); });
        // app.get("/", async (req, res, next) => {
        //   if (!req.user) res.redirect("/login");
        //   next();
        // });
        app.use("/", auth_1.default);
        wrap = function (middleware) { return function (socket, next) { return middleware(socket.request, {}, next); }; };
        io.use(function (socket, next) {
            sessionMiddleware(socket.request, {}, next);
        });
        io.use(wrap(passport_1.default.initialize()));
        io.use(wrap(passport_1.default.session()));
        io.use(function (socket, next) {
            var _a, _b;
            console.log(socket.request.user);
            var passportUser = (_b = (_a = socket.request.session) === null || _a === void 0 ? void 0 : _a.passport) === null || _b === void 0 ? void 0 : _b.user;
            if (passportUser) {
                var user = JSON.parse(passportUser);
                var id = user.id;
                socket.userID = id;
            }
            next();
        });
        io.on("connection", function (socket) {
            socket.emit("status", "Hello from Socket.io");
            socket.on("disconnect", function () {
                console.log("client disconnected");
            });
        });
        app.all("*", function (req, res) { return nextHandler(req, res); });
        server.listen(port, function () {
            console.log("> Ready on http://localhost:".concat(port));
        });
        return [2 /*return*/];
    });
}); });

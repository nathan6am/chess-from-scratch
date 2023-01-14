import express, { Express, Request, Response, NextFunction } from "express";
import session, { Session } from "express-session";
//Load environment variables before starting the custom server
import { loadEnvConfig } from "@next/env";
loadEnvConfig("./", process.env.NODE_ENV !== "production");
import * as http from "http";
import next, { NextApiHandler } from "next";
import * as socketio from "socket.io";
import connectRedis from "connect-redis";
let RedisStore = connectRedis(session);
import passport from "passport";
import authRouter from "./routes/auth";
import MainHandler from "./handlers/MainHandler";
import { createClient } from "redis";
import {
  InterServerEvents,
  SocketData,
  ClientToServerEvents,
  ServerToClientEvents,
  Socket,
  Server,
} from "./types/socket";
import {
  LobbyInterServerEvents,
  LobbySocketData,
  LobbyClientToServerEvents,
  LobbyServerToClientEvents,
  LobbySocket,
  LobbyServer,
} from "./types/lobby";

const redisClient = createClient();
const sessionClient = createClient({ legacyMode: true });

export type RedisClient = typeof redisClient;
import cors from "cors";
import LobbyHandler from "./handlers/LobbyHandler";

declare module "http" {
  interface IncomingMessage {
    user?: any;
    session: Session & {
      authenticated: boolean;
      passport?: {
        user: string;
      };
    };
  }
}

const hostname = process.env.HOSTNAME || "localhost";
const port: number = parseInt(process.env.PORT || "3000", 10);
console.log(`Environment: ${process.env.NODE_ENV}`);
const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev, hostname, port });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  const app: Express = express();
  const server: http.Server = http.createServer(app);

  //Create session client
  await sessionClient.connect();
  console.log("Connected to session client");

  //Create primary client

  await redisClient.connect();
  console.log("Connected to redis client");

  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    store: new RedisStore({ client: sessionClient }),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  });

  const io: socketio.Server = new socketio.Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >();
  io.attach(server);

  //Cross origin isolate for workers
  app.use((req, res, next) => {
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
  });
  app.use(cors());
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(passport.authenticate("session"));

  app.use("/", authRouter);

  //Wrap middleware for socket.io
  const wrap = (middleware: any) => (socket: any, next: any) =>
    middleware(socket.request, {}, next);

  io.use((socket, next) => {
    sessionMiddleware(
      socket.request as Request,
      {} as Response,
      next as NextFunction
    );
  });
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));

  io.use((socket: Socket, next) => {
    const passportUser = socket.request.session?.passport?.user;
    if (passportUser) {
      const user = JSON.parse(passportUser);
      socket.data.user = user;
      socket.data.userid = user.id;
    }
    next();
  });

  const lobbyNsp: socketio.Namespace<
    LobbyClientToServerEvents,
    LobbyServerToClientEvents,
    LobbyInterServerEvents,
    LobbySocketData
  > = io.of("/lobby");
  lobbyNsp.use(wrap(passport.initialize()));
  lobbyNsp.use(wrap(passport.session()));
  lobbyNsp.use((socket: Socket, next) => {
    const passportUser = socket.request.session?.passport?.user;
    if (passportUser) {
      const user = JSON.parse(passportUser);
      socket.data.user = user;
      socket.data.userid = user.id;
    }
    next();
  });

  const onConnection = (socket: Socket) => {
    MainHandler(io, socket, redisClient);
  };

  lobbyNsp.on("connection", (socket: LobbySocket) => {
    LobbyHandler(io, lobbyNsp, socket, redisClient);
    socket.on("disconnect", () => {
      console.log("client disconnected");
    });
  });

  io.on("connection", (socket: socketio.Socket) => {
    onConnection(socket);
    socket.on("disconnect", () => {
      console.log("client disconnected");
    });
  });

  app.all("*", (req: any, res: any) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

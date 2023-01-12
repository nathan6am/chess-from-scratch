import express, { Express, Request, Response, NextFunction } from "express";
import session, { Session } from "express-session";
//Load environment variables before starting the custom server
import { loadEnvConfig } from "@next/env";
loadEnvConfig("./", process.env.NODE_ENV !== "production");
import {
  InterServerEvents,
  SocketData,
  ClientToServerEvents,
  ServerToClientEvents,
  Socket,
} from "./@types/socket";
import * as http from "http";
import next, { NextApiHandler } from "next";
import * as socketio from "socket.io";
import redisClient from "./redis/sessionClient";
import connectRedis from "connect-redis";
let RedisStore = connectRedis(session);
import passport from "passport";
import authRouter from "./routes/auth";
import ConnectionHandler from "./handlers/ConnectionHandler";
import LobbyHandler from "./handlers/LobbyHandler";
import cors from "cors";

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

// declare module "socket.io" {
//   interface Socket {
//     sessionID?: string;
//     userID?: string;
//   }
// }
const hostname = process.env.HOSTNAME || "localhost";
const port: number = parseInt(process.env.PORT || "3000", 10);
console.log(process.env.NODE_ENV);
const dev: boolean = process.env.NODE_ENV !== "production";
console.log(dev);
const nextApp = next({ dev, hostname, port });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "keyboard cat",
  store: new RedisStore({ client: redisClient }),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
});

nextApp.prepare().then(async () => {
  const app: Express = express();
  const server: http.Server = http.createServer(app);
  const io: socketio.Server = new socketio.Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >();
  io.attach(server);
  //Cross origin isoalte for workers

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
  app.get("/hello", async (_: Request, res: Response) => {
    res.send("Hello World");
  });
  // app.get("/", async (req, res, next) => {
  //   if (!req.user) res.redirect("/login");
  //   next();
  // });
  app.use("/", authRouter);

  //wrap middleware for socket.io
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

  const onConnection = (socket: Socket) => {
    ConnectionHandler(io, socket);
    LobbyHandler(io, socket);
  };

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

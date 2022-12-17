import express, { Express, Request, Response, NextFunction } from "express";
import session, { Session } from "express-session";
//Load environment variables before starting the custom server
import { loadEnvConfig } from "@next/env";
loadEnvConfig("./", process.env.NODE_ENV !== "production");
import { createGame, serializeMoves } from "../util/chess/Chess";
import * as http from "http";
import next, { NextApiHandler } from "next";
import * as socketio from "socket.io";
import redisClient from "./redis/sessionClient";
import connectRedis from "connect-redis";
let RedisStore = connectRedis(session);
import passport from "passport";
import authRouter from "./routes/auth";
import { gameStateToFen } from "../util/chess/FenParser";

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

declare module "socket.io" {
  interface Socket {
    sessionID?: string;
    userID?: string;
  }
}
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
  const io: socketio.Server = new socketio.Server();
  io.attach(server);
  //Cross origin isoalte for workers
  app.use((req, res, next) => {
    res.header("Cross-Origin-Embedder-Policy", "require-corp");
    res.header("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(passport.authenticate("session"));
  app.get("/hello", async (_: Request, res: Response) => {
    res.send("Hello World");
  });
  app.get("/test", async (req, res) => {
    const gameJSON = createGame() as any;
    await redisClient.json.set("lobbyid", "$", {
      ...gameJSON,
      gameState: gameStateToFen(gameJSON.gameState),
      legalMoves: serializeMoves(gameJSON.legalMoves),
    });
    const game = await redisClient.json.get("lobbyid");
    res.status(200).json(game);
  });
  app.use("/", authRouter);

  //wrap middleware for socket.io
  const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next);

  io.use((socket, next) => {
    sessionMiddleware(socket.request as Request, {} as Response, next as NextFunction);
  });
  io.use(wrap(passport.initialize()));
  io.use(wrap(passport.session()));

  io.use((socket, next) => {
    console.log(socket.request.user);
    const passportUser = socket.request.session?.passport?.user;
    if (passportUser) {
      const user = JSON.parse(passportUser);
      const id = user.id;
      socket.userID = id;
    }
    next();
  });

  io.on("connection", (socket: socketio.Socket) => {
    socket.emit("status", "Hello from Socket.io");
    socket.on("disconnect", () => {
      console.log("client disconnected");
    });
  });

  app.all("*", (req: any, res: any) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

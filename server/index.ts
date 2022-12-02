import express, { Express, Request, Response, NextFunction } from "express";
import session, { Session } from "express-session";
//Load environment variables before starting the custom server
import { loadEnvConfig } from "@next/env";
loadEnvConfig("./", process.env.NODE_ENV !== "production");

import * as http from "http";
import next, { NextApiHandler } from "next";
import * as socketio from "socket.io";
import redis from "../util/db/redis";
import connectRedis from "connect-redis";
let RedisStore = connectRedis(session);
import passport from "passport";
import authRouter from "./routes/auth";
import { Socket } from "socket.io-client";
import { socket } from "@/context/socket";

declare module "http" {
  interface IncomingMessage {
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

const port: number = parseInt(process.env.PORT || "3000", 10);
const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "keyboard cat",
  store: new RedisStore({ client: redis }),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
});

nextApp.prepare().then(async () => {
  const app: Express = express();
  const server: http.Server = http.createServer(app);
  const io: socketio.Server = new socketio.Server();
  io.attach(server);

  app.use(sessionMiddleware);
  app.use(passport.authenticate("session"));
  app.get("/hello", async (_: Request, res: Response) => {
    res.send("Hello World");
  });
  app.use("/", authRouter);

  //wrap middleware for socket.io
  const wrap =
    (middleware: any) => (socket: socketio.Socket, next: NextFunction) =>
      middleware(socket.request, {}, next);

  io.use((socket, next) => {
    sessionMiddleware(
      socket.request as Request,
      {} as Response,
      next as NextFunction
    );
  });
  io.use((socket, next) => {
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

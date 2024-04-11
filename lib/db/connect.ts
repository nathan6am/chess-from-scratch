import "reflect-metadata";
import { DataSource } from "typeorm";
import User, { Notification, Credential, Profile } from "./entities/User";
import Game from "./entities/Game";
import Puzzle from "./entities/Puzzle";
import User_Game from "./entities/User_Game";
import Analysis from "./entities/Analysis";
import Collection from "./entities/Collection";
import Solved_Puzzle from "./entities/Solved_Puzzle";
import { loadEnvConfig } from "@next/env";
loadEnvConfig("./", process.env.NODE_ENV !== "production");
const username = process.env.DB_USERNAME || "";
const port = parseInt(process.env.DB_PORT || "5432");
const password = process.env.DB_PASSWORD || "";
const host = process.env.DB_HOST || "";
const database = process.env.DB_NAME || "";

export async function initialize() {
  const datasource = new DataSource({
    type: "postgres",
    username,
    port,
    password,
    database,
    host,
    entities: [User, Game, Puzzle, Analysis, Notification, User_Game, Credential, Collection, Profile, Solved_Puzzle],
    synchronize: true,
    poolSize: 10,
  });
  await datasource.initialize();
  return datasource;
}

export const conObject = {
  user: username,
  password,
  host,
  database,
  port,
};

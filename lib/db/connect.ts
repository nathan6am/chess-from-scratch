import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  User,
  Game,
  Puzzle,
  Notification,
  Analysis,
  User_Game,
  Credential,
} from "./entities/user";
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
    entities: [
      User,
      Game,
      Puzzle,
      Analysis,
      Notification,
      User_Game,
      Credential,
    ],
    synchronize: true,
  });
  await datasource.initialize();
}

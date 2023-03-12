import fs from "fs";
import { parse } from "csv";
import { finished } from "stream";
import "reflect-metadata";
import { DataSource } from "typeorm";
import User, { Notification, Credential, Profile } from "./entities/User";
import Game from "./entities/Game";
import Puzzle from "./entities/Puzzle";
import User_Game from "./entities/User_Game";
import Analysis from "./entities/Analysis";
import Collection from "./entities/Collection";
import { loadEnvConfig } from "@next/env";
loadEnvConfig("./", process.env.NODE_ENV !== "production");
import { initialize } from "./connect";

async function main() {
  await initialize();
  const parser = fs
    .createReadStream("./lichess_db_puzzle.csv")
    .pipe(parse({ delimiter: ",", from_line: 5534, relax_column_count: true }));
  let chunk: Puzzle[] = [];
  for await (const row of parser) {
    const [
      id,
      fen,
      moves,
      rating,
      ratingDeviation,
      popularity,
      nbPlays,
      themes,
      gameUrl,
      openingFamily,
      openingVariation,
    ] = row;
    const data = {
      id,
      fen,
      moves,
      rating: parseInt(rating),
      ratingDeviation: parseInt(ratingDeviation),
      popularity: parseInt(popularity),
      nbPlays,
      themes: themes.split(" "),
      gameUrl,
      openingFamily,
      openingVariation,
    };
    const puzzle = new Puzzle();
    Object.assign(puzzle, data);
    chunk.push(puzzle);
    if (chunk.length >= 5000) {
      await Puzzle.save(chunk);
      chunk = [];
    }
  }
}

main().then(() => {
  console.log("finished");
});

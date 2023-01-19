import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  User,
  Game,
  Puzzle,
  Notification,
  Analysis,
  User_Game,
} from "./models/user";
const datasource = new DataSource({
  type: "postgres",
  username: "",
  port: 5432,
  password: "",
  database: "test",
  host: "",
  entities: [User, Game, Puzzle, Analysis, Notification, User_Game],
  synchronize: true,
});
const testPuzzle = `00sHx,q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17,e8d7 a2e6 d7d8 f7f8,1760,80,83,72,mate mateIn2 middlegame short,https://lichess.org/yyznGmXs/black#34,Italian_Game,Italian_Game_Classical_Variation`;
(async () => {
  try {
    await datasource.initialize();
    console.log("Connection has been established successfully.");
    const puzzleRepo = datasource.getRepository(Puzzle);
    const args = testPuzzle.split(",");
    const [
      id,
      fen,
      moves,
      rating,
      deviation,
      popularity,
      nbPlays,
      themes,
      url,
      openingFamily,
      openingVariation,
    ] = args;
    const newPuzzle = new Puzzle();
    newPuzzle.id = id;
    newPuzzle.fen = fen;
    newPuzzle.moves = moves.split(" ");
    newPuzzle.rating = parseInt(rating);
    newPuzzle.ratingDeviation = parseInt(deviation);
    newPuzzle.popularity = parseInt(popularity);
    newPuzzle.nbPlays = parseInt(nbPlays);
    newPuzzle.themes = themes.split(" ");
    newPuzzle.gameUrl = url;
    newPuzzle.openingFamily = openingFamily;
    newPuzzle.openingVariation = openingVariation;

    await puzzleRepo.save(newPuzzle);
    console.log(newPuzzle);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

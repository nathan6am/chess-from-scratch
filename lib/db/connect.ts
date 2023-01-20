import "reflect-metadata";
import { DataSource } from "typeorm";
import { User, Game, Puzzle, Notification, Analysis, User_Game, Credential } from "./entities/user";
const datasource = new DataSource({
  type: "postgres",
  username: "ncadmin",
  port: 5432,
  password: "",
  database: "test",
  host: "nextchess-test.cgagzcwunlpi.us-east-1.rds.amazonaws.com",
  entities: [User, Game, Puzzle, Analysis, Notification, User_Game, Credential],
  synchronize: true,
});
const testPuzzle = `00sHx,q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17,e8d7 a2e6 d7d8 f7f8,1760,80,83,72,mate mateIn2 middlegame short,https://lichess.org/yyznGmXs/black#34,Italian_Game,Italian_Game_Classical_Variation`;

(async () => {
  try {
    await datasource.initialize();
    // console.log("Connection has been established successfully.");
    // const puzzleRepo = datasource.getRepository(Puzzle);
    // const args = testPuzzle.split(",");
    // const [id, fen, moves, rating, deviation, popularity, nbPlays, themes, url, openingFamily, openingVariation] = args;
    // const newPuzzle = new Puzzle();
    // newPuzzle.id = id;
    // newPuzzle.fen = fen;
    // newPuzzle.moves = moves.split(" ");
    // newPuzzle.rating = parseInt(rating);
    // newPuzzle.ratingDeviation = parseInt(deviation);
    // newPuzzle.popularity = parseInt(popularity);
    // newPuzzle.nbPlays = parseInt(nbPlays);
    // newPuzzle.themes = themes.split(" ");
    // newPuzzle.gameUrl = url;
    // newPuzzle.openingFamily = openingFamily;
    // newPuzzle.openingVariation = openingVariation;

    // await puzzleRepo.save(newPuzzle);
    // console.log(newPuzzle);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();
const userRepo = datasource.getRepository(User);
export async function createUser(user: Partial<User>): Promise<User> {
  let newuser = new User();

  const created = await userRepo.save(newuser);
  return created;
}

export async function getUserSimple(userid: string): Promise<Partial<User> | null> {
  const user = await userRepo.createQueryBuilder("user").where("user.id = :id", { id: userid }).getOne();
  return user;
}

export async function byFbId(facebookId: string): Promise<Partial<User> | null> {
  const user = await userRepo
    .createQueryBuilder("user")
    .select(["user.id", "user.name", "user.username", "user.profileComplete"])
    .where("user.facebookId = :facebookId", { facebookId })
    .getOne();
  return user;
}

export async function createAccountWithCredentials(details: {
  email: string;
  password: string;
  username: string;
  name: string;
}) {
  const newuser = await User.createAccountWithCredentials(details);
  return newuser;
}
export default datasource;

export async function login(credentials: { username?: string; email?: string; password: string }) {
  const user = await User.verifyCredentials(credentials);
  return user || null;
}

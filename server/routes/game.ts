import passport from "passport";
import * as passportFacebook from "passport-facebook";
import express, { Request } from "express";
import passportCustom from "passport-custom";
import { v4 as uuidv4 } from "uuid";
import { customRandom, urlAlphabet, random } from "nanoid";
import * as passportLocal from "passport-local";
import User, { SessionUser } from "../../lib/db/entities/User";
import Analysis from "../../lib/db/entities/Analysis";
import Game from "../../lib/db/entities/Game";
import verifyUser, { VerifiedRequest } from "../middleware/verifyUser";
import * as Chess from "../../lib/chess";
import User_Game, { GameSearchOptions } from "../../lib/db/entities/User_Game";
const nanoid = customRandom(urlAlphabet, 10, random);

const router = express.Router();

router.get("/my-games", verifyUser, async (req: VerifiedRequest, res) => {
  const user = req.verifiedUser;
  const results = ["win", "loss", "draw"];
  const result =
    typeof req.query.result === "string"
      ? (req.query.result.split(",").filter((val) => results.includes(val)) as Array<"win" | "loss" | "draw">)
      : undefined;
  const before: Date | undefined = typeof req.query.before === "string" ? new Date(req.query.before) : undefined;
  const after: Date | undefined = typeof req.query.after === "string" ? new Date(req.query.after) : undefined;
  const asColor: "w" | "b" | undefined =
    typeof req.query.asColor === "string" && (req.query.asColor === "w" || req.query.asColor === "b")
      ? (req.query.asColor as "w" | "b")
      : undefined;
  const page = typeof req.query.page === "string" ? parseInt(req.query.page) : 1;
  const pageSize = typeof req.query.pageSize === "string" ? parseInt(req.query.pageSize) : 12;
  const sortBy =
    typeof req.query.sortBy === "string" &&
    (req.query.sortBy === "date" || req.query.sortBy === "rating" || req.query.sortBy === "opponentRating")
      ? req.query.sortBy
      : "date";
  const sortDirection =
    typeof req.query.sortDirection === "string" &&
    (req.query.sortDirection === "ASC" || req.query.sortDirection === "DESC")
      ? req.query.sortDirection
      : "DESC";
  const searchOptions: GameSearchOptions = {
    result,
    before,
    after,
    asColor,
    page,
    pageSize,
    sortBy,
    sortDirection,
  };

  if (!user) return res.status(401);
  const games = await User_Game.findGamesByUser(user.id, searchOptions);
  if (games) return res.status(200).json({ games });
  else res.status(400).end();
});
router.get("/:id", async (req: Request<{ id: string }>, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "No ID provided" });
  const game = await Game.findOneBy({ id });
  if (!game) return res.status(404).json({ error: "Game not found" });
  return res.status(200).json(game);
});
router.get("/pgn/:id", async (req: Request<{ id: string }>, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "No ID provided" });
  const game = await Game.findOneBy({ id });
  if (!game) return res.status(404).json({ error: "Game not found" });
  return res.status(200).json(game.pgn);
});

export default router;

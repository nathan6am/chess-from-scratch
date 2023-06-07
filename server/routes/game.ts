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
const nanoid = customRandom(urlAlphabet, 10, random);

const router = express.Router();

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

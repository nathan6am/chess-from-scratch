import passport from "passport";
import * as passportFacebook from "passport-facebook";
import express from "express";
import passportCustom from "passport-custom";
import { v4 as uuidv4 } from "uuid";
import { customAlphabet } from "nanoid";
import * as passportLocal from "passport-local";
import { User } from "../../lib/db/entities/user";
const nanoid = customAlphabet("1234567890", 10);

const router = express.Router();

router.get("/profile", async function (req, res) {
  const id = req.user?.id;
  if (!id) return res.status(401);
  if (req.user?.type === "guest") {
    res.status(200).json({ profile: null, type: "guest" });
  }

  const user = User.findOne({ where: { id } });
});

router.get("/checkusername", async function (req, res) {
  console.log(req.query);
  const username = req.query.username;
  if (!username || typeof username !== "string") {
    res.status(400).end();
    return;
  }
  const exists = await User.usernameExists(username);
  res.status(200).json({ valid: !exists });
});

export default router;

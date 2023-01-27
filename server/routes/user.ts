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

  const profile = await User.getProfile(id);
  if (!profile) {
    return res.status(404);
  } else {
    res.status(200).json(profile);
    return;
  }
});

router.post("/complete-profile", async (req, res) => {
  const id = req.user?.id;
  if (!id) return res.status(401);
  if (req.user?.type === "guest") return res.status(401);
  const profile = req.body;
  const { name, username, rating, country } = profile;
  const user = await User.findOneBy({ id });
  if (!user) return res.status(404);

  if (name) user.name = name;
  if (username) user.username = username;
  user.rating = parseInt(rating);
  if (country) user.country = country;
  user.profileComplete = true;
  const updated: User = await user.save();
  res.status(200).json({ updated: true, profile: updated });
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

const userRouter = router;
export default userRouter;

import express from "express";

//DB Entities
import User, { SessionUser } from "../../lib/db/entities/User";

//Middleware
import verifyUser from "../middleware/verifyUser";
import User_Game from "../../lib/db/entities/User_Game";

const router = express.Router();

/**
 * Get the profile of the authenticated user
 */
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

/**
 * Update the profile of the authenticated user
 */
router.patch("/profile", async function (req, res) {
  const user: SessionUser | undefined = req.user;
  if (!user) return res.status(401);
  if (user.type === "guest") return res.status(401);
  const profile = req.body;
  const updated = await User.updateProfile(user.id, profile);
  if (!updated) return res.status(404);
  res.status(200).json(updated);
});

/**
 * Complete the profile of the authenticated user
 */
router.post("/complete-profile", async (req, res) => {
  const id = req.user?.id;
  if (!id) return res.status(401);
  if (req.user?.type === "guest") return res.status(401);
  try {
    const profile = req.body;
    const { name, username, rating, country, bio } = profile;
    const user = await User.findOneBy({ id });
    if (!user) return res.status(404);
    User.createProfile(user.id, { country, bio });
    if (name) user.name = name;
    if (username) user.username = username;
    //Initialize ratings
    user.ratings = {
      bullet: {
        rating: parseInt(rating),
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
      },
      blitz: {
        rating: parseInt(rating),
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
      },
      rapid: {
        rating: parseInt(rating),
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
      },
      classical: {
        rating: parseInt(rating),
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
      },
      puzzle: {
        rating: parseInt(rating),
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
      },
      correspondence: {
        rating: parseInt(rating),
        ratingDeviation: 350,
        volatility: 0.06,
        gameCount: 0,
      },
    };
    user.complete = true;
    const updated: User = await user.save();
    res.status(200).json({ updated: true, profile: updated });
  } catch (e) {
    return res.status(400).end();
  }
});

/**
 * Check if a username is available
 */
router.get("/checkusername", async function (req, res) {
  const username = req.query.username;
  if (!username || typeof username !== "string") {
    res.status(400).end();
    return;
  }
  const exists = await User.usernameExists(username);
  res.status(200).json({ valid: !exists });
});

router.get("/games", async function (req, res) {
  const user: SessionUser | undefined = req.user;
  if (!user) return res.status(401);
  if (user.type === "guest") return res.status(401);
  const games = await User.getGames(user.id);
  res.status(200).json(games);
});

router.get("/ratings", verifyUser, async function (req, res) {
  const user: SessionUser | undefined = req.user;
  if (!user) return res.status(401);
  if (user.type === "guest") return res.status(401);
  const userDoc = await User.findById(user.id);
  if (!userDoc) return res.status(404);
  const ratings = userDoc.ratings;
  res.status(200).json(ratings);
});

router.get("/rating-history", verifyUser, async function (req, res) {
  const user: SessionUser | undefined = req.user;
  const { from, ratingCategory } = req.query;
  if (!user) return res.status(401);
  if (user.type === "guest") return res.status(401);
  const ratingHistory = await User_Game.getRatingHistory(user.id, "rapid");
  res.status(200).json(ratingHistory);
});

const userRouter = router;
export default userRouter;

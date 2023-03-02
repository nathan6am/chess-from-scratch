import passport from "passport";
import * as passportFacebook from "passport-facebook";
import express, { Request } from "express";
import passportCustom from "passport-custom";
import { v4 as uuidv4 } from "uuid";
import { customRandom, urlAlphabet, random } from "nanoid";
import * as passportLocal from "passport-local";
import User, { SessionUser } from "../../lib/db/entities/User";
import Analysis from "../../lib/db/entities/Analysis";
import Collection from "../../lib/db/entities/Collection";
import verifyUser, { VerifiedRequest } from "../middleware/verifyUser";
const nanoid = customRandom(urlAlphabet, 10, random);

const router = express.Router();

router.get("/my-collections", verifyUser, async (req: VerifiedRequest, res) => {
  const user = req.verifiedUser;
  if (!user) return res.status(401);
  const collections = await User.getCollections(user.id);
  const all = await Analysis.getAllByUser(user.id);
  if (collections && all) return res.status(200).json({ collections, all });
  else res.status(400).end();
});

router.post("/create", verifyUser, async (req: VerifiedRequest, res) => {
  const { title } = req.body;
  const user = req.verifiedUser;
  if (!user) return res.status(401);
  if (!title || typeof title !== "string") return res.status(400);
  const collection = await Collection.createNew(title, user);
  if (collection) return res.status(201).json({ collection });
  else res.status(400).end();
});

router.delete("/delete/:id", verifyUser, async (req: VerifiedRequest, res) => {
  const { id } = req.params;
  const user = req.verifiedUser;
  if (!user) return res.status(401);
  const collection = await Collection.findOne({
    where: {
      id: id,
      user: {
        id: user.id,
      },
    },
  });
  if (!collection) return res.status(404);
  const deleted = await collection.remove();
  return res.status(200).json({ deleted });
});

export default router;

import express from "express";

//DB Entities
import User from "../../lib/db/entities/User";
import Collection from "../../lib/db/entities/Collection";

//Middleware
import verifyUser, { VerifiedRequest } from "../middleware/verifyUser";

const router = express.Router();

/**
 * Retrieves all collections for the authenticated user
 */
router.get("/my-collections", verifyUser, async (req: VerifiedRequest, res) => {
  const user = req.verifiedUser;
  if (!user) return res.status(401);
  const collections = await User.getCollections(user.id);
  if (collections) return res.status(200).json({ collections });
  else res.status(400).end();
});

/**
 * Creates a new collection for the authenticated user
 */
router.post("/create", verifyUser, async (req: VerifiedRequest, res) => {
  const { title } = req.body;
  const user = req.verifiedUser;
  if (!user) return res.status(401);
  if (!title || typeof title !== "string") return res.status(400);
  const collection = await Collection.createNew(title, user);
  if (collection) return res.status(201).json({ collection });
  else res.status(400).end();
});

/**
 * Updates the title of a collection
 */
router.put("/:id", verifyUser, async (req: VerifiedRequest, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const user = req.verifiedUser;
  if (!user) return res.status(401);
  if (!title || typeof title !== "string") return res.status(400);
  const collection = await Collection.findOne({
    where: {
      id: id,
      user: {
        id: user.id,
      },
    },
  });
  if (!collection) return res.status(404);
  collection.title = title;
  const updated = await collection.save();
  return res.status(200).json({ updated });
});

/**
 * Deletes a collection
 */
router.delete("/:id", verifyUser, async (req: VerifiedRequest, res) => {
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

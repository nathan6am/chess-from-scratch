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
const nanoid = customRandom(urlAlphabet, 10, random);

const router = express.Router();

router.get(
  "/",
  async (
    req: Request<{
      queryString: string;
      tags?: string[];
      filters: any[];
    }>,
    res
  ) => {}
);
router.post(
  "/",
  async (
    req: Request<
      any,
      any,
      {
        title: string;
        description?: string;
        collectionIds: string[];
        tags?: string[];
        pgn: string;
        visibility: "private" | "unlisted" | "public";
      }
    >,
    res
  ) => {
    if (!req.user || req.user?.type === "guest") return res.status(401);
    const user = await User.findOneBy({ id: req.user.id });
    if (!user) return res.status(401);
    const { title, description, collectionIds, tags, pgn, visibility } = req.body;
    const analysis = new Analysis();
    const collections = await Collection.getByIds(collectionIds);
    Object.assign(analysis, {
      title,
      author: user,
      pgn,
      description: description || null,
      tags: tags || [],
      visibility,
      collections,
    });
    const created = await analysis.save();
    if (created) {
      return res.status(200).json(created);
    } else {
      return res.status(400);
    }
  }
);

router.put(
  "/:id",
  async (
    req: Request<
      { id: string },
      unknown,
      {
        title: string;
        description?: string;
        collectionIds: string[];
        tags?: string[];
        pgn: string;
        visibility: "private" | "unlisted" | "public";
      }
    >,
    res
  ) => {
    const { id } = req.params;
    const updated = await Analysis.updateById(id, req.body);
    res.status(200).json(updated);
  }
);

router.get("/:id", async (req, res) => {
  const userid = req.user?.id;
  const { id } = req.params;
  const analysis = await Analysis.findOne({
    where: { id },
    relations: {
      author: true,
    },
  });
  if (!analysis) return res.status(404).end("Analysis not found");
  if (analysis.visibility === "private") {
    if (analysis.author.id !== userid) return res.status(401).end("Unauthorized");
  }
  return res.status(200).json(analysis);
});

export default router;

import express, { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { customRandom, urlAlphabet, random } from "nanoid";
import User, { SessionUser } from "../../lib/db/entities/User";
import Analysis from "../../lib/db/entities/Analysis";
import Collection from "../../lib/db/entities/Collection";
import { SavedAnalysis, PGNTagData } from "../../lib/types";
import verifyUser, { VerifiedRequest } from "../middleware/verifyUser";

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
        tagData: PGNTagData;
        pgn: string;
        visibility: "private" | "unlisted" | "public";
      }
    >,
    res
  ) => {
    if (!req.user || req.user?.type === "guest") return res.status(401);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401);
    const { title, description, collectionIds, tagData, visibility, pgn } = req.body;
    const analysis = new Analysis();
    Object.assign(analysis, {
      title,
      authorId: user.id,
      pgn,
      description: description || null,
      tagData,
      visibility,
    });
    const created = await analysis.save();
    if (collectionIds) {
      Analysis.addToCollections(analysis.id, collectionIds);
    }
    if (created) {
      return res.status(200).json(created);
    } else {
      return res.status(400);
    }
  }
);

router.put(
  "/:id",
  verifyUser,
  async (
    req: Request<{ id: string }, unknown, Partial<Omit<Analysis, "id" | "forkedFrom">>>,
    res
  ) => {
    const userid = req.user?.id;
    const { id } = req.params;
    try {
      const canEdit = await Analysis.verifyAuthor(id, userid);
      if (canEdit) {
        const updated = await Analysis.updateById(id, req.body);
        res.status(200).json(updated);
        return;
      } else {
        res.status(401).end();
        return;
      }
    } catch (e) {
      res.status(500).end();
      return;
    }
  }
);

router.get("/:id", async (req, res) => {
  const userid = req.user?.id;
  const { id } = req.params;
  const analysis = await Analysis.findOne({
    where: { id },
    relations: {
      author: true,
      collections: true,
    },
  });
  if (!analysis) return res.status(404).end("Analysis not found");
  if (analysis.visibility === "private") {
    if (analysis.author.id !== userid) return res.status(401).end("Unauthorized");
  }
  return res.status(200).json({
    analysis,
    readonly: analysis.author.id !== userid,
  });
});

router.post("/:id/fork", verifyUser, async (req: VerifiedRequest, res) => {
  const user = req.verifiedUser;
  if (!user) return res.status(401).end();
  const { id } = req.params;
  const { collections } = req.body;
  try {
    const analysis = await Analysis.findOneBy({ id });
    if (!analysis) return res.status(404).end();
    if (analysis.visibility === "private" && analysis.authorId !== user.id)
      return res.status(401).end();
    const forked = new Analysis();
    const { id: sourceId, authorId, collectionIds, forkedFromId, ...rest } = analysis;
    Object.assign(forked, {
      ...rest,
      authorId: user.id,
      forkedFromId: sourceId,
      collectionIds: collections || [],
    });
    await forked.save();
    res.status(200).json({ success: true, analysis: forked });
  } catch (e) {
    res.status(500).end();
  }
});

export default router;

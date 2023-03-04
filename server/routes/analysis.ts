import express, { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { customRandom, urlAlphabet, random } from "nanoid";
import User, { SessionUser } from "../../lib/db/entities/User";
import Analysis from "../../lib/db/entities/Analysis";
import Collection from "../../lib/db/entities/Collection";
import { SavedAnalysis } from "../../hooks/useSavedAnalysis";
import verifyUser, { VerifiedRequest } from "../middleware/verifyUser";
import { PGNTagData } from "../../util/parsers/pgnParser";
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
        tags: PGNTagData;
        moveText: string;
        pgn: string;
        visibility: "private" | "unlisted" | "public";
      }
    >,
    res
  ) => {
    if (!req.user || req.user?.type === "guest") return res.status(401);
    const user = await User.findOneBy({ id: req.user.id });
    if (!user) return res.status(401);
    const { title, description, collectionIds, tags, moveText, visibility, pgn } = req.body;
    const analysis = new Analysis();
    Object.assign(analysis, {
      title,
      authorId: user.id,
      pgn,
      moveText,
      description: description || null,
      tags,
      visibility,
      collectionIds,
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
  async (req: Request<{ id: string }, unknown, Partial<Omit<SavedAnalysis, "id" | "forkedFrom">>>, res) => {
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
      collections: true,
    },
    select: {
      moveText: true,
      pgn: true,
      id: true,
      tags: {
        white: true,
        black: true,
        eloWhite: true,
        eloBlack: true,
        titleWhite: true,
        titleBlack: true,
        site: true,
        event: true,
        round: true,
        date: true,
        timeControl: true,
        result: true,
        opening: true,
        variation: true,
        subVariation: true,
        eco: true,
        setUp: true,
        fen: true,
      },
      collections: {
        id: true,
        title: true,
      },
      author: {
        id: true,
        name: true,
      },
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

router.post("/:id/fork", verifyUser, async (req: VerifiedRequest, res) => {});

export default router;

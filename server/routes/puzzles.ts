import Puzzle from "../../lib/db/entities/Puzzle";
import express, { Request } from "express";
import { TbHeartMinus } from "react-icons/tb";

const router = express.Router({ mergeParams: true });

interface PuzzleQuery {
  minRating?: string;
  maxRating?: string;
  sampleSize?: string;
  themes?: string;
  exclude?: string;
}
router.get("/", async (req: Request<any, any, any, Partial<PuzzleQuery>>, res) => {
  const minRating = parseInt(req.query.minRating || "0");
  const maxRating = parseInt(req.query.maxRating || "4000");
  const sampleSize = parseInt(req.query.sampleSize || "25");
  const themes = req.query.themes ? req.query.themes.split(",") : null;
  try {
    const puzzles = await Puzzle.getPuzzles({ minRating, maxRating, sampleSize, themes });
    if (puzzles) {
      res.status(200).json({ puzzles });
    } else {
      res.status(404).end();
    }
  } catch (e) {
    res.status(500).end();
  }
});
export default router;

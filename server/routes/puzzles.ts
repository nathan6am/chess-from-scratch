import express, { Request } from "express";

//DB Entities
import Puzzle from "../../lib/db/entities/Puzzle";
import User from "../../lib/db/entities/User";

//Middleware
import verifyUser from "../middleware/verifyUser";

const router = express.Router({ mergeParams: true });

interface PuzzleQuery {
  minRating?: string;
  maxRating?: string;
  sampleSize?: string;
  themes?: string;
  exclude?: string;
}

/**
 * Query puzzles
 */
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

/**
 * Get a single puzzle
 */
router.get("/puzzle/:id", async (req, res) => {
  const { id } = req.params;
  const puzzle = await Puzzle.findOne({ where: { id } });
  if (puzzle) {
    res.status(200).json({ puzzle });
  } else {
    res.status(404).end();
  }
});

type Result = "solved" | "solved-w-hint" | "failed";

function stringIsResult(s: string): s is Result {
  return ["solved", "solved-w-hint", "failed"].includes(s);
}

/**
 * Solve a puzzle for the authenticated user
 */
router.post("/solve/:id", verifyUser, async (req, res) => {
  const userid = req.user?.id;
  const { id } = req.params;
  const { result, rated } = req.query;
  if (typeof result !== "string" || !stringIsResult(result)) return res.status(400).end("Invalid result");
  if (typeof rated !== "string" || !["true", "false"].includes(rated)) return res.status(400).end("Invalid rated");
  try {
    const solvedPuzzle = await User.solvePuzzle(userid, id, result, rated === "true");
    if (solvedPuzzle) {
      res.status(200).json({ solvedPuzzle });
    } else {
      res.status(404).end();
    }
  } catch (e) {
    res.status(500).end();
  }
});

export default router;

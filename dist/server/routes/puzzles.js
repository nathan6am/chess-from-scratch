"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Puzzle_1 = __importDefault(require("../../lib/db/entities/Puzzle"));
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../../lib/db/entities/User"));
const verifyUser_1 = __importDefault(require("../middleware/verifyUser"));
const router = express_1.default.Router({ mergeParams: true });
router.get("/", async (req, res) => {
    const minRating = parseInt(req.query.minRating || "0");
    const maxRating = parseInt(req.query.maxRating || "4000");
    const sampleSize = parseInt(req.query.sampleSize || "25");
    const themes = req.query.themes ? req.query.themes.split(",") : null;
    try {
        const puzzles = await Puzzle_1.default.getPuzzles({ minRating, maxRating, sampleSize, themes });
        if (puzzles) {
            res.status(200).json({ puzzles });
        }
        else {
            res.status(404).end();
        }
    }
    catch (e) {
        res.status(500).end();
    }
});
router.get("/puzzle/:id", async (req, res) => {
    const { id } = req.params;
    const puzzle = await Puzzle_1.default.findOne({ where: { id } });
    if (puzzle) {
        res.status(200).json({ puzzle });
    }
    else {
        res.status(404).end();
    }
});
function stringIsResult(s) {
    return ["solved", "solved-w-hint", "failed"].includes(s);
}
router.post("/solve/:id", verifyUser_1.default, async (req, res) => {
    const userid = req.user?.id;
    const { id } = req.params;
    const { result, rated } = req.query;
    if (typeof result !== "string" || !stringIsResult(result))
        return res.status(400).end("Invalid result");
    if (typeof rated !== "string" || !["true", "false"].includes(rated))
        return res.status(400).end("Invalid rated");
    try {
        const solvedPuzzle = await User_1.default.solvePuzzle(userid, id, result, rated === "true");
        if (solvedPuzzle) {
            res.status(200).json({ solvedPuzzle });
        }
        else {
            res.status(404).end();
        }
    }
    catch (e) {
        res.status(500).end();
    }
});
exports.default = router;

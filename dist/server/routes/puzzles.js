"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Puzzle_1 = __importDefault(require("../../lib/db/entities/Puzzle"));
const express_1 = __importDefault(require("express"));
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
exports.default = router;

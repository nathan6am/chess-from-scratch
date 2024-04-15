"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
//DB Entities
const Game_1 = __importDefault(require("../../lib/db/entities/Game"));
const User_Game_1 = __importDefault(require("../../lib/db/entities/User_Game"));
//Middleware
const verifyUser_1 = __importDefault(require("../middleware/verifyUser"));
const router = express_1.default.Router();
/**
 * Query games for the authenticated user
 */
router.get("/my-games", verifyUser_1.default, async (req, res) => {
    const user = req.verifiedUser;
    const results = ["win", "loss", "draw"];
    const result = typeof req.query.result === "string"
        ? req.query.result.split(",").filter((val) => results.includes(val))
        : undefined;
    const before = typeof req.query.before === "string" ? new Date(req.query.before) : undefined;
    const after = typeof req.query.after === "string" ? new Date(req.query.after) : undefined;
    const ratingCategory = typeof req.query.ratingCategory === "string"
        ? req.query.ratingCategory
            .split(",")
            .filter((val) => val === "bullet" || val === "blitz" || val === "rapid" || val === "classical")
        : undefined;
    const asColor = typeof req.query.asColor === "string" && (req.query.asColor === "w" || req.query.asColor === "b")
        ? req.query.asColor
        : undefined;
    const page = typeof req.query.page === "string" ? parseInt(req.query.page) : 1;
    const pageSize = typeof req.query.pageSize === "string" ? parseInt(req.query.pageSize) : 15;
    const sortBy = typeof req.query.sortBy === "string" &&
        (req.query.sortBy === "date" || req.query.sortBy === "rating" || req.query.sortBy === "opponentRating")
        ? req.query.sortBy
        : "date";
    const sortDirection = typeof req.query.sortDirection === "string" &&
        (req.query.sortDirection === "ASC" || req.query.sortDirection === "DESC")
        ? req.query.sortDirection
        : "DESC";
    const searchOptions = {
        result,
        before,
        after,
        asColor,
        ratingCategory,
        page,
        pageSize,
        sortBy,
        sortDirection,
    };
    if (!user)
        return res.status(401);
    const games = await User_Game_1.default.findGamesByUser(user.id, searchOptions);
    if (games)
        return res.status(200).json({ games });
    else
        res.status(400).end();
});
/**
 * Retrieves a game by ID
 */
router.get("/:id", async (req, res) => {
    const id = req.params.id;
    if (!id)
        return res.status(400).json({ error: "No ID provided" });
    const game = await Game_1.default.findOneBy({ id });
    if (!game)
        return res.status(404).json({ error: "Game not found" });
    return res.status(200).json(game);
});
/**
 * Retrieves the PGN of a game by ID
 */
router.get("/pgn/:id", async (req, res) => {
    const id = req.params.id;
    if (!id)
        return res.status(400).json({ error: "No ID provided" });
    const game = await Game_1.default.findOneBy({ id });
    if (!game)
        return res.status(404).json({ error: "Game not found" });
    return res.status(200).json(game.pgn);
});
/**
 * Save a game vs the computer or local multiplayer
 */
router.post("/save", verifyUser_1.default, async (req, res) => { });
exports.default = router;

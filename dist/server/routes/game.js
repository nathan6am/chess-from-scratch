"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nanoid_1 = require("nanoid");
const Game_1 = __importDefault(require("../../lib/db/entities/Game"));
const verifyUser_1 = __importDefault(require("../middleware/verifyUser"));
const User_Game_1 = __importDefault(require("../../lib/db/entities/User_Game"));
const nanoid = (0, nanoid_1.customRandom)(nanoid_1.urlAlphabet, 10, nanoid_1.random);
const router = express_1.default.Router();
router.get("/my-games", verifyUser_1.default, async (req, res) => {
    const user = req.verifiedUser;
    const searchOptions = req.body;
    if (!user)
        return res.status(401);
    const games = await User_Game_1.default.findGamesByUser(user.id, searchOptions);
    if (games)
        return res.status(200).json({ games });
    else
        res.status(400).end();
});
router.get("/:id", async (req, res) => {
    const id = req.params.id;
    if (!id)
        return res.status(400).json({ error: "No ID provided" });
    const game = await Game_1.default.findOneBy({ id });
    if (!game)
        return res.status(404).json({ error: "Game not found" });
    return res.status(200).json(game);
});
router.get("/pgn/:id", async (req, res) => {
    const id = req.params.id;
    if (!id)
        return res.status(400).json({ error: "No ID provided" });
    const game = await Game_1.default.findOneBy({ id });
    if (!game)
        return res.status(404).json({ error: "Game not found" });
    return res.status(200).json(game.pgn);
});
exports.default = router;

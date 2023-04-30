"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nanoid_1 = require("nanoid");
const User_1 = __importDefault(require("../../lib/db/entities/User"));
const nanoid = (0, nanoid_1.customAlphabet)("1234567890", 10);
const router = express_1.default.Router();
router.get("/profile", async function (req, res) {
    const id = req.user?.id;
    if (!id)
        return res.status(401);
    if (req.user?.type === "guest") {
        res.status(200).json({ profile: null, type: "guest" });
    }
    const profile = await User_1.default.getProfile(id);
    if (!profile) {
        return res.status(404);
    }
    else {
        res.status(200).json(profile);
        return;
    }
});
router.post("/complete-profile", async (req, res) => {
    const id = req.user?.id;
    if (!id)
        return res.status(401);
    if (req.user?.type === "guest")
        return res.status(401);
    try {
        const profile = req.body;
        const { name, username, rating, country, bio } = profile;
        const user = await User_1.default.findOneBy({ id });
        if (!user)
            return res.status(404);
        User_1.default.createProfile(user.id, { country, bio });
        if (name)
            user.name = name;
        if (username)
            user.username = username;
        user.rating = parseInt(rating);
        const updated = await user.save();
        res.status(200).json({ updated: true, profile: updated });
    }
    catch (e) {
        return res.status(400).end();
    }
});
router.get("/checkusername", async function (req, res) {
    const username = req.query.username;
    if (!username || typeof username !== "string") {
        res.status(400).end();
        return;
    }
    const exists = await User_1.default.usernameExists(username);
    res.status(200).json({ valid: !exists });
});
router.get("/games", async function (req, res) {
    const user = req.user;
    if (!user)
        return res.status(401);
    if (user.type === "guest")
        return res.status(401);
    const games = await User_1.default.getGames(user.id);
    res.status(200).json(games);
});
const userRouter = router;
exports.default = userRouter;

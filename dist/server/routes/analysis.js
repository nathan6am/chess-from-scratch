"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nanoid_1 = require("nanoid");
const User_1 = __importDefault(require("../../lib/db/entities/User"));
const Analysis_1 = __importDefault(require("../../lib/db/entities/Analysis"));
const verifyUser_1 = __importDefault(require("../middleware/verifyUser"));
const nanoid = (0, nanoid_1.customRandom)(nanoid_1.urlAlphabet, 10, nanoid_1.random);
const router = express_1.default.Router();
router.get("/", async (req, res) => { });
router.post("/", async (req, res) => {
    if (!req.user || req.user?.type === "guest")
        return res.status(401);
    const user = await User_1.default.findById(req.user.id);
    if (!user)
        return res.status(401);
    const { title, description, collectionIds, tagData, visibility, pgn } = req.body;
    const analysis = new Analysis_1.default();
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
        Analysis_1.default.addToCollections(analysis.id, collectionIds);
    }
    if (created) {
        return res.status(200).json(created);
    }
    else {
        return res.status(400);
    }
});
router.put("/:id", verifyUser_1.default, async (req, res) => {
    const userid = req.user?.id;
    const { id } = req.params;
    try {
        const canEdit = await Analysis_1.default.verifyAuthor(id, userid);
        if (canEdit) {
            const updated = await Analysis_1.default.updateById(id, req.body);
            res.status(200).json(updated);
            return;
        }
        else {
            res.status(401).end();
            return;
        }
    }
    catch (e) {
        res.status(500).end();
        return;
    }
});
router.get("/:id", async (req, res) => {
    const userid = req.user?.id;
    const { id } = req.params;
    const analysis = await Analysis_1.default.findOne({
        where: { id },
        relations: {
            author: true,
            collections: true,
        },
    });
    if (!analysis)
        return res.status(404).end("Analysis not found");
    if (analysis.visibility === "private") {
        if (analysis.author.id !== userid)
            return res.status(401).end("Unauthorized");
    }
    return res.status(200).json({
        analysis,
        readonly: analysis.author.id !== userid,
    });
});
router.post("/:id/fork", verifyUser_1.default, async (req, res) => {
    const user = req.verifiedUser;
    if (!user)
        return res.status(401).end();
    const { id } = req.params;
    const { collections } = req.body;
    try {
        const analysis = await Analysis_1.default.findOneBy({ id });
        if (!analysis)
            return res.status(404).end();
        if (analysis.visibility === "private" && analysis.authorId !== user.id)
            return res.status(401).end();
        const forked = new Analysis_1.default();
        const { id: sourceId, authorId, collectionIds, forkedFromId, ...rest } = analysis;
        Object.assign(forked, {
            ...rest,
            authorId: user.id,
            forkedFromId: sourceId,
            collectionIds: collections || [],
        });
        await forked.save();
        res.status(200).json({ success: true, analysis: forked });
    }
    catch (e) {
        res.status(500).end();
    }
});
exports.default = router;

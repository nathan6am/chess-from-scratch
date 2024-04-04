"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
//DB Entities
const User_1 = __importDefault(require("../../lib/db/entities/User"));
const Collection_1 = __importDefault(require("../../lib/db/entities/Collection"));
//Middleware
const verifyUser_1 = __importDefault(require("../middleware/verifyUser"));
const router = express_1.default.Router();
/**
 * Retrieves all collections for the authenticated user
 */
router.get("/my-collections", verifyUser_1.default, async (req, res) => {
    const user = req.verifiedUser;
    if (!user)
        return res.status(401);
    const collections = await User_1.default.getCollections(user.id);
    if (collections)
        return res.status(200).json({ collections });
    else
        res.status(400).end();
});
/**
 * Creates a new collection for the authenticated user
 */
router.post("/create", verifyUser_1.default, async (req, res) => {
    const { title } = req.body;
    const user = req.verifiedUser;
    if (!user)
        return res.status(401);
    if (!title || typeof title !== "string")
        return res.status(400);
    const collection = await Collection_1.default.createNew(title, user);
    if (collection)
        return res.status(201).json({ collection });
    else
        res.status(400).end();
});
/**
 * Updates the title of a collection
 */
router.put("/:id", verifyUser_1.default, async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const user = req.verifiedUser;
    if (!user)
        return res.status(401);
    if (!title || typeof title !== "string")
        return res.status(400);
    const collection = await Collection_1.default.findOne({
        where: {
            id: id,
            user: {
                id: user.id,
            },
        },
    });
    if (!collection)
        return res.status(404);
    collection.title = title;
    const updated = await collection.save();
    return res.status(200).json({ updated });
});
/**
 * Deletes a collection
 */
router.delete("/:id", verifyUser_1.default, async (req, res) => {
    const { id } = req.params;
    const user = req.verifiedUser;
    if (!user)
        return res.status(401);
    const collection = await Collection_1.default.findOne({
        where: {
            id: id,
            user: {
                id: user.id,
            },
        },
    });
    if (!collection)
        return res.status(404);
    const deleted = await collection.remove();
    return res.status(200).json({ deleted });
});
exports.default = router;

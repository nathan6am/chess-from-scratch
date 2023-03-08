"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nanoid_1 = require("nanoid");
const User_1 = __importDefault(require("../../lib/db/entities/User"));
const Analysis_1 = __importDefault(require("../../lib/db/entities/Analysis"));
const Collection_1 = __importDefault(require("../../lib/db/entities/Collection"));
const verifyUser_1 = __importDefault(require("../middleware/verifyUser"));
const nanoid = (0, nanoid_1.customRandom)(nanoid_1.urlAlphabet, 10, nanoid_1.random);
const router = express_1.default.Router();
router.get("/my-collections", verifyUser_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.verifiedUser;
    if (!user)
        return res.status(401);
    const collections = yield User_1.default.getCollections(user.id);
    const all = yield Analysis_1.default.getAllByUser(user.id);
    if (collections && all)
        return res.status(200).json({ collections, all });
    else
        res.status(400).end();
}));
router.post("/create", verifyUser_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title } = req.body;
    const user = req.verifiedUser;
    if (!user)
        return res.status(401);
    if (!title || typeof title !== "string")
        return res.status(400);
    const collection = yield Collection_1.default.createNew(title, user);
    if (collection)
        return res.status(201).json({ collection });
    else
        res.status(400).end();
}));
router.delete("/delete/:id", verifyUser_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = req.verifiedUser;
    if (!user)
        return res.status(401);
    const collection = yield Collection_1.default.findOne({
        where: {
            id: id,
            user: {
                id: user.id,
            },
        },
    });
    if (!collection)
        return res.status(404);
    const deleted = yield collection.remove();
    return res.status(200).json({ deleted });
}));
exports.default = router;

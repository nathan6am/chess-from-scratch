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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () { }));
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.type) === "guest")
        return res.status(401);
    const user = yield User_1.default.findById(req.user.id);
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
        collectionIds,
    });
    const created = yield analysis.save();
    if (created) {
        return res.status(200).json(created);
    }
    else {
        return res.status(400);
    }
}));
router.put("/:id", verifyUser_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userid = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const { id } = req.params;
    try {
        const canEdit = yield Analysis_1.default.verifyAuthor(id, userid);
        if (canEdit) {
            const updated = yield Analysis_1.default.updateById(id, req.body);
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
}));
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const userid = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
    const { id } = req.params;
    const analysis = yield Analysis_1.default.findOne({
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
}));
router.post("/:id/fork", verifyUser_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.verifiedUser;
    if (!user)
        return res.status(401).end();
    const { id } = req.params;
    const { collections } = req.body;
    try {
        const analysis = yield Analysis_1.default.findOneBy({ id });
        if (!analysis)
            return res.status(404).end();
        if (analysis.visibility === "private" && analysis.authorId !== user.id)
            return res.status(401).end();
        const forked = new Analysis_1.default();
        const { id: sourceId, authorId, collectionIds, forkedFromId } = analysis, rest = __rest(analysis, ["id", "authorId", "collectionIds", "forkedFromId"]);
        Object.assign(forked, Object.assign(Object.assign({}, rest), { authorId: user.id, forkedFromId: sourceId, collectionIds: collections || [] }));
        yield forked.save();
        res.status(200).json({ success: true, analysis: forked });
    }
    catch (e) {
        res.status(500).end();
    }
}));
exports.default = router;

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
const user_1 = require("../../lib/db/entities/user");
const nanoid = (0, nanoid_1.customAlphabet)("1234567890", 10);
const router = express_1.default.Router();
router.get("/profile", function (req, res) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!id)
            return res.status(401);
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.type) === "guest") {
            res.status(200).json({ profile: null, type: "guest" });
        }
        const user = user_1.User.findOne({ where: { id } });
    });
});
router.get("/checkusername", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(req.query);
        const username = req.query.username;
        if (!username || typeof username !== "string") {
            res.status(400).end();
            return;
        }
        const exists = yield user_1.User.usernameExists(username);
        res.status(200).json({ valid: !exists });
    });
});
exports.default = router;

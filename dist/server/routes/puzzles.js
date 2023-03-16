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
const Puzzle_1 = __importDefault(require("../../lib/db/entities/Puzzle"));
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router({ mergeParams: true });
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const minRating = parseInt(req.query.minRating || "0");
    const maxRating = parseInt(req.query.maxRating || "4000");
    const sampleSize = parseInt(req.query.sampleSize || "25");
    const themes = req.query.themes ? req.query.themes.split(",") : null;
    try {
        const puzzles = yield Puzzle_1.default.getPuzzles({ minRating, maxRating, sampleSize, themes });
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
}));
exports.default = router;

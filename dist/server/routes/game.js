"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const nanoid_1 = require("nanoid");
const nanoid = (0, nanoid_1.customRandom)(nanoid_1.urlAlphabet, 10, nanoid_1.random);
const router = express_1.default.Router();
exports.default = router;

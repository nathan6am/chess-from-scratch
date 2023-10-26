"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../../lib/db/entities/User"));
async function verifyUser(req, res, next) {
    const user = req.user;
    const id = user?.id;
    if (!user || user.type == "guest" || !id)
        return res.status(401);
    const dbUser = await User_1.default.findOneBy({ id });
    if (!dbUser)
        return res.status(404);
    req.verifiedUser = dbUser;
    next();
}
exports.default = verifyUser;

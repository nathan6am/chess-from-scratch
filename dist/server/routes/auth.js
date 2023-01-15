"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var passport_1 = __importDefault(require("passport"));
var passportFacebook = __importStar(require("passport-facebook"));
var express_1 = __importDefault(require("express"));
var passport_custom_1 = __importDefault(require("passport-custom"));
var uuid_1 = require("uuid");
var nanoid_1 = require("nanoid");
var nanoid = (0, nanoid_1.customAlphabet)("1234567890", 10);
var facebookClientID = process.env.FACEBOOK_APP_ID || "";
var facebookClientSecret = process.env.FACEBOOK_APP_SECRET || "";
var facebookCallbackURL = process.env.BASE_URL + "/auth/facebook/callback";
passport_1.default.use(new passportFacebook.Strategy({
    clientID: facebookClientID,
    clientSecret: facebookClientSecret,
    callbackURL: facebookCallbackURL,
}, function (accessToken, refreshToken, profile, done) {
    var user = { id: profile.id, name: profile.displayName };
    return done(null, user);
}));
passport_1.default.use("guest", new passport_custom_1.default.Strategy(function (_req, done) {
    var uid = (0, uuid_1.v4)();
    var user = {
        id: uid,
        name: "Guest_".concat(nanoid()),
    };
    console.log(user);
    return done(null, user);
}));
passport_1.default.serializeUser(function (user, done) {
    done(null, JSON.stringify(user));
});
passport_1.default.deserializeUser(function (_req, id, done) {
    var user = JSON.parse(id);
    done(null, user);
});
var router = express_1.default.Router();
router.get("/auth/facebook", passport_1.default.authenticate("facebook"));
router.get("/auth/facebook/callback", passport_1.default.authenticate("facebook", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/failure",
}));
router.get("/auth/guest", passport_1.default.authenticate("guest", { failureRedirect: "/login", session: true }), function (req, res) {
    res.redirect("/");
});
router.get("/auth/user", function (req, res, next) {
    if (!req.user) {
        res.status(200).json({});
    }
    else {
        res.status(200).json(req.user);
    }
});
router.get("/auth/logout", function (req, res, next) {
    console.log("logging out");
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});
exports.default = router;

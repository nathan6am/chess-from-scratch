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
const passport_1 = __importDefault(require("passport"));
const passportFacebook = __importStar(require("passport-facebook"));
const express_1 = __importDefault(require("express"));
const passport_custom_1 = __importDefault(require("passport-custom"));
const uuid_1 = require("uuid");
const nanoid_1 = require("nanoid");
const passportLocal = __importStar(require("passport-local"));
const User_1 = __importDefault(require("../../lib/db/entities/User"));
const nanoid = (0, nanoid_1.customAlphabet)("1234567890", 10);
const facebookClientID = process.env.FACEBOOK_APP_ID || "";
const facebookClientSecret = process.env.FACEBOOK_APP_SECRET || "";
const facebookCallbackURL = process.env.BASE_URL + "api/auth/facebook/callback";
passport_1.default.use(new passportLocal.Strategy(async function (username, password, done) {
    const user = await User_1.default.login({ username, password });
    if (user) {
        return done(null, user);
    }
    else {
        return done(null, false, { message: "Invalid username or password" });
    }
}));
passport_1.default.use(new passportFacebook.Strategy({
    clientID: facebookClientID,
    clientSecret: facebookClientSecret,
    callbackURL: facebookCallbackURL,
}, async function (accessToken, refreshToken, profile, done) {
    const user = User_1.default.loginWithFacebook({
        name: profile.displayName,
        facebookId: profile.id,
    });
    if (user) {
        return done(null, user);
    }
    else {
        return done(new Error("Unable to create User"));
    }
}));
passport_1.default.use("guest", new passport_custom_1.default.Strategy((_req, done) => {
    const uid = (0, uuid_1.v4)();
    const user = {
        id: uid,
        username: `Guest_${nanoid()}`,
        type: "guest",
    };
    return done(null, user);
}));
passport_1.default.serializeUser((user, done) => {
    done(null, JSON.stringify(user));
});
passport_1.default.deserializeUser((req, id, done) => {
    const sessionUser = JSON.parse(id);
    if (sessionUser.type === "guest" || sessionUser.type === "user") {
        done(null, sessionUser);
    }
    else {
        User_1.default.findOneBy({ id: sessionUser.id }).then((user) => {
            if (!user) {
                req.logout();
                done("account does not exist", null);
            }
            else
                done(null, { id: user.id, username: user.username, type: user.type });
        });
    }
});
const router = express_1.default.Router();
router.get("/facebook", passport_1.default.authenticate("facebook"));
router.get("/facebook/callback", passport_1.default.authenticate("facebook", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/failure",
}));
router.get("/guest", passport_1.default.authenticate("guest", { failureRedirect: "/login", session: true }), (req, res) => {
    res.redirect("/");
});
router.get("/user", function (req, res, next) {
    if (!req.user) {
        res.status(200).json({});
    }
    else {
        res.status(200).json(req.user);
    }
});
router.post("/login", passport_1.default.authenticate("local", {}), function (req, res) {
    if (req.user) {
        console.log("logged in");
        res.json({ user: req.user });
    }
    else {
        res.status(401).send();
    }
});
router.post("/signup", async function (req, res, next) {
    const accountdetails = req.body;
    if (!accountdetails) {
        res.status(400).send();
        return;
    }
    const { email, password, username } = accountdetails;
    if (!email ||
        typeof email !== "string" ||
        !username ||
        typeof username !== "string" ||
        !password ||
        typeof password !== "string") {
        res.status(400).send();
        return;
    }
    const result = await User_1.default.createAccountWithCredentials(accountdetails);
    if (result.created) {
        req.logIn(result.created, function (err) {
            if (err) {
                return next(err);
            }
            else {
                return res.status(201).json({ user: result.created });
            }
        });
    }
    else {
        res.status(200).json(result);
    }
});
router.get("/checkusername", async function (req, res) {
    console.log(req.query);
    const username = req.query.username;
    if (!username || typeof username !== "string") {
        res.status(400).end();
        return;
    }
    const exists = await User_1.default.usernameExists(username);
    res.status(200).json({ valid: !exists });
});
router.post("/change-password", async function (req, res) {
    const sessionUser = req.user;
    if (!sessionUser || sessionUser.type === "guest") {
        res.status(401).end();
        return;
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        res.status(400).end();
        return;
    }
    const updated = await User_1.default.updateCredentials(sessionUser.id, currentPassword, newPassword);
    if (updated)
        return res.status(200).json({ updated: true });
    else {
        res.status(401).end();
    }
});
router.get("/logout", function (req, res, next) {
    console.log("logging out");
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});
exports.default = router;

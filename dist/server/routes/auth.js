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
const express_1 = __importDefault(require("express"));
//Auth Libraries
const passport_1 = __importDefault(require("passport"));
const passport_custom_1 = __importDefault(require("passport-custom"));
const passportLocal = __importStar(require("passport-local"));
const passportFacebook = __importStar(require("passport-facebook"));
const paasportGoogle = __importStar(require("passport-google-oauth20"));
//Utilities
const uuid_1 = require("uuid");
const nanoid_1 = require("nanoid");
const normalize_email_1 = __importDefault(require("normalize-email"));
//Entities
const User_1 = __importDefault(require("../../lib/db/entities/User"));
//RedisLayer
const index_1 = require("../index");
const redisClientWrapper_1 = require("../util/redisClientWrapper");
const mail_handler_1 = require("../mail-handler");
const nanoid = (0, nanoid_1.customAlphabet)("1234567890", 10);
//Environment Variables
const facebookClientID = process.env.FACEBOOK_APP_ID || "";
const facebookClientSecret = process.env.FACEBOOK_APP_SECRET || "";
const facebookCallbackURL = process.env.BASE_URL + "/api/auth/facebook/callback";
const googleClientID = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const googleCallbackURL = process.env.BASE_URL + "/api/auth/google/callback";
//Local Strategy
passport_1.default.use(new passportLocal.Strategy(async function (username, password, done) {
    const user = await User_1.default.login({ username, password });
    if (user) {
        return done(null, user);
    }
    else {
        return done(null, false, { message: "Invalid username or password" });
    }
}));
//Facebook Strategy
passport_1.default.use(new passportFacebook.Strategy({
    clientID: facebookClientID,
    clientSecret: facebookClientSecret,
    callbackURL: facebookCallbackURL,
}, async function (_accessToken, _refreshToken, profile, done) {
    const user = await User_1.default.loginWithFacebook({
        name: profile.displayName,
        facebookId: profile.id,
    });
    if (user) {
        console.log(user);
        return done(null, user);
    }
    else {
        return done(new Error("Unable to create User"));
    }
}));
//Google Strategy
passport_1.default.use(new paasportGoogle.Strategy({
    clientID: googleClientID,
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackURL,
}, async function (_accessToken, _refreshToken, profile, done) {
    const googleId = profile.id;
    const user = await User_1.default.loginWithGoogle({ googleId, name: profile.displayName });
    if (user) {
        return done(null, user);
    }
    else {
        return done(new Error("Unable to create User"));
    }
}));
//Guest Strategy
passport_1.default.use("guest", new passport_custom_1.default.Strategy((_req, done) => {
    const uid = (0, uuid_1.v4)();
    const user = {
        id: uid,
        username: `Guest_${nanoid()}`,
        type: "guest",
    };
    return done(null, user);
}));
//Serialize and Deserialize
passport_1.default.serializeUser((user, done) => {
    console.log("serializing", user);
    done(null, JSON.stringify(user));
});
passport_1.default.deserializeUser((req, id, done) => {
    const sessionUser = JSON.parse(id);
    if (sessionUser.type !== "incomplete" && sessionUser.username) {
        // console.log("deserializing", sessionUser);
        return done(null, sessionUser);
    }
    else {
        try {
            User_1.default.findOneBy({ id: sessionUser.id }).then((user) => {
                if (!user) {
                    console.log("here");
                    req.logout();
                    return done("account does not exist", null);
                }
                else {
                    console.log("user found", user);
                    return done(null, { id: user.id, username: user.username, type: user.type });
                }
            });
        }
        catch (e) {
            console.error(e);
            return done(null, sessionUser);
        }
    }
});
const router = express_1.default.Router();
router.get("/facebook", passport_1.default.authenticate("facebook"));
router.get("/facebook/callback", passport_1.default.authenticate("facebook", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/login",
}));
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile"] }));
router.get("/google/callback", passport_1.default.authenticate("google", { successReturnToOrRedirect: "/", failureRedirect: "/login" }));
router.get("/guest", passport_1.default.authenticate("guest", { failureRedirect: "/login", session: true }), (req, res) => {
    res.redirect("/");
});
router.get("/user", async function (req, res, next) {
    // console.log("user", req.user);
    if (!req.user) {
        res.status(401).send("Unauthorized");
    }
    else {
        const sessionUser = await User_1.default.getSessionUser(req.user.id);
        if (sessionUser)
            res.status(200).json(sessionUser);
        else
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
router.get("/verify-email", async function (req, res) {
    const redisLayer = (0, redisClientWrapper_1.wrapClient)(index_1.redisClient);
    const token = req.query.token;
    if (!token || typeof token !== "string") {
        console.log("token is required");
        res.status(400).end();
        return;
    }
    const userid = await redisLayer.validateVerificationToken(token);
    if (!userid) {
        console.log(`token: ${token} not found`);
        res.status(400).end();
        return;
    }
    const user = await User_1.default.findOneBy({ id: userid });
    if (!user) {
        console.log("user not found");
        res.status(400).end();
        return;
    }
    user.emailVerified = true;
    await user.save();
    // sign out the user upon verification
    req.logout(function (err) {
        if (err) {
            console.log(err);
        }
    });
    res.status(200).end();
});
router.post("/forgot-password", async function (req, res) {
    const _email = req.body.email;
    if (!_email || typeof _email !== "string") {
        res.status(400).end();
        return;
    }
    const email = (0, normalize_email_1.default)(_email);
    const user = await User_1.default.findOne({
        relations: {
            credentials: true,
        },
        where: {
            credentials: {
                email,
            },
        },
    });
    if (!user) {
        //Don't reveal if the email exists
        res.status(200).end();
        return;
    }
    const redisLayer = (0, redisClientWrapper_1.wrapClient)(index_1.redisClient);
    const token = await redisLayer.generateResetToken(user.id);
});
router.post("/reset-password", async function (req, res) {
    const { password, token } = req.body;
    if (!password || !token) {
        res.status(400).end();
        return;
    }
    const redisLayer = (0, redisClientWrapper_1.wrapClient)(index_1.redisClient);
    const userid = await redisLayer.validateResetToken(token);
    if (!userid) {
        res.status(400).end();
        return;
    }
    const success = await User_1.default.resetPassword(userid, password);
    if (success) {
        res.status(200).end();
        return;
    }
    else {
        res.status(400).end();
        return;
    }
});
router.post("/send-verification-email", async function (req, res) {
    if (!req.user) {
        res.status(401).end();
        return;
    }
    if (req.user.type === "guest") {
        res.status(401).end();
        return;
    }
    const user = await User_1.default.findOne({
        relations: {
            credentials: true,
        },
        where: {
            id: req.user.id,
        },
    });
    if (!user) {
        res.status(400).end();
        return;
    }
    if (user.emailVerified) {
        res.status(400).end();
        return;
    }
    const redisLayer = (0, redisClientWrapper_1.wrapClient)(index_1.redisClient);
    const token = await redisLayer.generateVerificationToken(user.id);
    const sent = await (0, mail_handler_1.sendVerificationEmail)({ email: user.credentials.email, name: user.name || "", token });
    if (sent) {
        res.status(200).json({ sent: true, email: user.credentials.email });
    }
    else {
        res.status(500).end();
    }
});
router.post("/resend-verification-email", async function (req, res) {
    const redisLayer = (0, redisClientWrapper_1.wrapClient)(index_1.redisClient);
    if (!req.user) {
        res.status(401).end();
        return;
    }
    const sessionUser = req.user;
    if (sessionUser.type === "guest") {
        res.status(400).end();
        return;
    }
    const userid = sessionUser.id;
    const user = await User_1.default.findOne({
        relations: {
            credentials: true,
        },
        where: {
            id: userid,
        },
    });
    if (!user) {
        res.status(400).end();
        return;
    }
    if (user.emailVerified) {
        res.status(400).end();
        return;
    }
    const token = await redisLayer.generateVerificationToken(user.id);
    const sent = await (0, mail_handler_1.sendVerificationEmail)({ email: user.credentials.email, name: user.name || "", token });
    if (sent) {
        res.status(200).end();
    }
    else {
        res.status(500).end();
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

import { access } from "fs";
import passport from "passport";
import * as passportFacebook from "passport-facebook";
import express from "express";
import passportCustom from "passport-custom";
import { v4 as uuidv4 } from "uuid";
import { customAlphabet } from "nanoid";
import {
  byFbId,
  createAccountWithCredentials,
  createUser,
  login,
  updateCredentials,
} from "../../lib/db/connect";
import * as passportLocal from "passport-local";
const nanoid = customAlphabet("1234567890", 10);
const facebookClientID = process.env.FACEBOOK_APP_ID || "";
const facebookClientSecret = process.env.FACEBOOK_APP_SECRET || "";
const facebookCallbackURL = process.env.BASE_URL + "/auth/facebook/callback";

passport.use(
  new passportLocal.Strategy(async function (username, password, done) {
    console.log("pre db");
    const user = await login({ username, password });
    console.log(user);
    if (user) {
      return done(null, user);
    } else {
      return done(new Error("Invalid credentials"));
    }
  })
);

passport.use(
  new passportFacebook.Strategy(
    {
      clientID: facebookClientID,
      clientSecret: facebookClientSecret,
      callbackURL: facebookCallbackURL,
    },
    async function (accessToken, refreshToken, profile, done) {
      const existingUser = await byFbId(profile.id);
      if (existingUser) {
        console.log(existingUser);
        return done(null, existingUser);
      }
      const user = { facebookId: profile.id, name: profile.displayName };
      const createdUser = createUser(user);
      console.log(createdUser);
      if (createdUser) {
        return done(null, createdUser);
      } else {
        return done(new Error("Unable to create User"));
      }
    }
  )
);

passport.use(
  "guest",
  new passportCustom.Strategy((_req, done) => {
    const uid = uuidv4();
    const user = {
      id: uid,
      name: `Guest_${nanoid()}`,
      type: "guest",
    };
    console.log(user);
    return done(null, user);
  })
);

passport.serializeUser((user, done) => {
  done(null, JSON.stringify(user));
});

passport.deserializeUser((_req: any, id: string, done: any) => {
  const user = JSON.parse(id);
  done(null, user);
});
const router = express.Router();

router.get("/auth/facebook", passport.authenticate("facebook"));

router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/failure",
  })
);

router.get(
  "/auth/guest",
  passport.authenticate("guest", { failureRedirect: "/login", session: true }),
  (req, res) => {
    res.redirect("/");
  }
);

router.get("/auth/user", function (req, res, next) {
  if (!req.user) {
    res.status(200).json({});
  } else {
    res.status(200).json(req.user);
  }
});

router.get("/auth/status", async function (req, res) {});
router.post(
  "/auth/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  function (req, res) {
    console.log("here");
    if (req.user) {
      res.json({ user: req.user });
    } else {
      res.status(401).send();
    }
  }
);
router.post("/auth/signup", async function (req, res) {
  const accountdetails = req.body;
  if (!accountdetails) {
    res.status(400).send();
    return;
  }
  console.log(accountdetails);
  const { email, password, username, name } = accountdetails;
  if (
    !email ||
    typeof email !== "string" ||
    !username ||
    typeof username !== "string" ||
    !password ||
    typeof password !== "string" ||
    !name ||
    typeof name !== "string"
  ) {
    res.status(400).send();
    return;
  }
  const created = await createAccountWithCredentials(req.body);
  if (created) {
    res.status(201).json(created);
  }
});

router.post("/auth/updatetest", async function (req, res) {
  const credentials = req.body;
  if (
    credentials.password &&
    typeof credentials.password === "string" &&
    credentials.username &&
    typeof credentials.username === "string"
  ) {
    const user = await updateCredentials(
      credentials.username,
      credentials.password
    );

    res.status(200).send();
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

export default router;

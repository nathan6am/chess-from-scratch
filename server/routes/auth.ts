import { access } from "fs";
import passport from "passport";
import * as passportFacebook from "passport-facebook";
import express from "express";
import passportCustom from "passport-custom";
import { v4 as uuidv4 } from "uuid";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890", 10);
const facebookClientID = process.env.FACEBOOK_APP_ID || "";
const facebookClientSecret = process.env.FACEBOOK_APP_SECRET || "";
const facebookCallbackURL = process.env.BASE_URL + "/auth/facebook/callback";

passport.use(
  new passportFacebook.Strategy(
    {
      clientID: facebookClientID,
      clientSecret: facebookClientSecret,
      callbackURL: facebookCallbackURL,
    },
    function (accessToken, refreshToken, profile, done) {
      console.log(profile);
      const user = { id: profile.id, name: profile.displayName };
      return done(null, user);
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
    };
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

router.get("/auth/guest", passport.authenticate("guest", { failureRedirect: "/login" }), (req, res) => {
  res.redirect("/");
});

router.get("/auth/user", function (req, res, next) {
  if (!req.user) {
    console.log(req.sessionID);
    res.status(200).json({});
  } else {
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

export default router;

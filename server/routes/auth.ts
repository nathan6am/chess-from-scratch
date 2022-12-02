import { access } from "fs";
import passport from "passport";
import * as passportFacebook from "passport-facebook";
import express from "express";

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
      const user = { id: profile.id, name: profile.displayName };
      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, JSON.stringify(user));
});

passport.deserializeUser((req: any, id: string, done: any) => {
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

router.get("/auth/user", function (req, res, next) {
  if (!req.user) {
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

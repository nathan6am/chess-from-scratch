import passport from "passport";
import * as passportFacebook from "passport-facebook";
import express from "express";
import passportCustom from "passport-custom";
import { v4 as uuidv4 } from "uuid";
import { customAlphabet } from "nanoid";
import * as passportLocal from "passport-local";
import { User } from "../../lib/db/entities/user";
const nanoid = customAlphabet("1234567890", 10);
const facebookClientID = process.env.FACEBOOK_APP_ID || "";
const facebookClientSecret = process.env.FACEBOOK_APP_SECRET || "";
const facebookCallbackURL = process.env.BASE_URL + "/auth/facebook/callback";

passport.use(
  new passportLocal.Strategy(async function (username, password, done) {
    const user = await User.login({ username, password });
    console.log(user);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false, { message: "Invalid username or password" });
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
      const user = User.loginWithFacebook({ name: profile.displayName, facebookId: profile.id });
      if (user) {
        return done(null, user);
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
      username: `Guest_${nanoid()}`,
      type: "guest",
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

router.get("/auth/guest", passport.authenticate("guest", { failureRedirect: "/login", session: true }), (req, res) => {
  res.redirect("/");
});

router.get("/auth/user", function (req, res, next) {
  if (!req.user) {
    res.status(200).json({});
  } else {
    res.status(200).json(req.user);
  }
});

router.get("/auth/status", async function (req, res) {});
router.post("/auth/login", passport.authenticate("local", { failureRedirect: "/login" }), function (req, res) {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).send();
  }
});

router.post("/auth/signup", async function (req, res, next) {
  const accountdetails = req.body;
  if (!accountdetails) {
    res.status(400).send();
    return;
  }
  const { email, password, username } = accountdetails;
  if (
    !email ||
    typeof email !== "string" ||
    !username ||
    typeof username !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    res.status(400).send();
    return;
  }
  const result = await User.createAccountWithCredentials(accountdetails);
  if (result.created) {
    req.logIn(result.created, function (err) {
      if (err) {
        return next(err);
      } else {
        return res.status(204).json({ user: result.created });
      }
    });
  } else {
    res.status(200).json(result);
  }
});

router.get("/auth/checkusername", async function (req, res) {
  console.log(req.query);
  const username = req.query.username;
  if (!username || typeof username !== "string") {
    res.status(400).end();
    return;
  }
  const exists = await User.usernameExists(username);
  res.status(200).json({ valid: !exists });
});

// router.post("/auth/updatetest", async function (req, res) {
//   const credentials = req.body;
//   if (
//     credentials.password &&
//     typeof credentials.password === "string" &&
//     credentials.username &&
//     typeof credentials.username === "string"
//   ) {
//     const user = await updateCredentials(credentials.username, credentials.password);

//     res.status(200).send();
//   }
// });

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

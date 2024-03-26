import passport from "passport";
import * as passportFacebook from "passport-facebook";
import express, { Request } from "express";
import passportCustom from "passport-custom";
import { v4 as uuidv4 } from "uuid";
import { customAlphabet } from "nanoid";
import * as passportLocal from "passport-local";
import User, { SessionUser } from "../../lib/db/entities/User";
const nanoid = customAlphabet("1234567890", 10);
const facebookClientID = process.env.FACEBOOK_APP_ID || "";
const facebookClientSecret = process.env.FACEBOOK_APP_SECRET || "";
const facebookCallbackURL = process.env.BASE_URL + "/api/auth/facebook/callback";

passport.use(
  new passportLocal.Strategy(async function (username, password, done) {
    const user = await User.login({ username, password });
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
      const user = User.loginWithFacebook({
        name: profile.displayName,
        facebookId: profile.id,
      });
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

passport.deserializeUser((req: any, id: string, done: any) => {
  const sessionUser: SessionUser = JSON.parse(id);
  if (sessionUser.type === "guest" || sessionUser.type === "user") {
    done(null, sessionUser);
  } else {
    User.findOneBy({ id: sessionUser.id }).then((user) => {
      if (!user) {
        req.logout();
        done("account does not exist", null);
      } else done(null, { id: user.id, username: user.username, type: user.type });
    });
  }
});
const router = express.Router();

router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/failure",
  })
);

router.get("/guest", passport.authenticate("guest", { failureRedirect: "/login", session: true }), (req, res) => {
  res.redirect("/");
});

router.get("/user", async function (req, res, next) {
  console.log("user", req.user);
  if (!req.user) {
    res.status(401).send("Unauthorized");
  } else {
    const sessionUser = await User.getSessionUser(req.user.id);
    if (sessionUser) res.status(200).json(sessionUser);
    else res.status(200).json(req.user);
  }
});

router.post("/login", passport.authenticate("local", {}), function (req, res) {
  if (req.user) {
    console.log("logged in");
    res.json({ user: req.user });
  } else {
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
        return res.status(201).json({ user: result.created });
      }
    });
  } else {
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
  const exists = await User.usernameExists(username);
  res.status(200).json({ valid: !exists });
});

router.post("/change-password", async function (req: Request<{ currentPassword: string; newPassword: string }>, res) {
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
  const updated = await User.updateCredentials(sessionUser.id, currentPassword, newPassword);

  if (updated) return res.status(200).json({ updated: true });
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

export default router;

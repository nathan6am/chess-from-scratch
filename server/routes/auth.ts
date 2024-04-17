import express, { Request } from "express";

//Auth Libraries
import passport from "passport";
import passportCustom from "passport-custom";
import * as passportLocal from "passport-local";
import * as passportFacebook from "passport-facebook";
import * as paasportGoogle from "passport-google-oauth20";

//Utilities
import { v4 as uuidv4 } from "uuid";
import { customAlphabet } from "nanoid";
import normalizeEmail from "normalize-email";

//Entities
import User, { SessionUser } from "../../lib/db/entities/User";

//RedisLayer
import { redisClient } from "../index";
import { wrapClient } from "../util/redisClientWrapper";
import { sendVerificationEmail } from "../mail-handler";

const nanoid = customAlphabet("1234567890", 10);

//Environment Variables
const facebookClientID = process.env.FACEBOOK_APP_ID || "";
const facebookClientSecret = process.env.FACEBOOK_APP_SECRET || "";
const facebookCallbackURL = process.env.BASE_URL + "/api/auth/facebook/callback";

const googleClientID = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const googleCallbackURL = process.env.BASE_URL + "/api/auth/google/callback";

//Local Strategy
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

//Facebook Strategy
passport.use(
  new passportFacebook.Strategy(
    {
      clientID: facebookClientID,
      clientSecret: facebookClientSecret,
      callbackURL: facebookCallbackURL,
    },
    async function (_accessToken, _refreshToken, profile, done) {
      const user = await User.loginWithFacebook({
        name: profile.displayName,
        facebookId: profile.id,
      });
      if (user) {
        console.log(user);
        return done(null, user);
      } else {
        return done(new Error("Unable to create User"));
      }
    }
  )
);

//Google Strategy
passport.use(
  new paasportGoogle.Strategy(
    {
      clientID: googleClientID,
      clientSecret: googleClientSecret,
      callbackURL: googleCallbackURL,
    },
    async function (_accessToken, _refreshToken, profile, done) {
      const googleId = profile.id;
      const user = await User.loginWithGoogle({ googleId, name: profile.displayName });
      if (user) {
        return done(null, user);
      } else {
        return done(new Error("Unable to create User"));
      }
    }
  )
);

//Guest Strategy
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

//Serialize and Deserialize
passport.serializeUser((user, done) => {
  console.log("serializing", user);
  done(null, JSON.stringify(user));
});

passport.deserializeUser((req: any, id: string, done: any) => {
  const sessionUser: SessionUser = JSON.parse(id);
  if (sessionUser.type !== "incomplete" && sessionUser.username) {
    // console.log("deserializing", sessionUser);
    return done(null, sessionUser);
  } else {
    try {
      User.findOneBy({ id: sessionUser.id }).then((user) => {
        if (!user) {
          console.log("here");
          req.logout();
          return done("account does not exist", null);
        } else {
          console.log("user found", user);
          return done(null, { id: user.id, username: user.username, type: user.type });
        }
      });
    } catch (e) {
      console.error(e);
      return done(null, sessionUser);
    }
  }
});

const router = express.Router();

router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/login",
  })
);

router.get("/google", passport.authenticate("google", { scope: ["profile"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { successReturnToOrRedirect: "/", failureRedirect: "/login" })
);

router.get("/guest", passport.authenticate("guest", { failureRedirect: "/login", session: true }), (req, res) => {
  res.redirect("/");
});

router.get("/user", async function (req, res, next) {
  // console.log("user", req.user);
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

router.get("/verify-email", async function (req, res) {
  const redisLayer = wrapClient(redisClient);
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
  const user = await User.findOneBy({ id: userid });
  if (!user) {
    console.log("user not found");
    res.status(400).end();
    return;
  }
  user.emailVerified = true;
  await user.save();
  res.status(200).end();
});

router.post("/resend-verification-email", async function (req, res) {
  const redisLayer = wrapClient(redisClient);
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

  const user = await User.findOne({
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
  const sent = await sendVerificationEmail({ email: user.credentials.email, name: user.name || "", token });
  if (sent) {
    res.status(200).end();
  } else {
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

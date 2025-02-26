// @ts-types="npm:@types/express"
import express, { response } from "npm:express";
import { body, query, validationResult } from "npm:express-validator";
// @ts-types="npm:@types/body-parser"
import bodyParser from "npm:body-parser";
// @ts-types="npm:@types/pug"
import pug from "npm:pug";
import {
  createSession,
  createUser,
  generateSessionToken,
  getAllUsers,
  getUser,
  userExists,
  validateSessionToken,
} from "./auth.ts";
import cookieParser from "npm:cookie-parser";
import { encodeHex } from "jsr:@std/encoding/hex";

// Users
// Bookings
// Calendar
// Xero Integration
// Assets
// Configurable questions

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const templateIndex = pug.compileFile("./src/templates/index.pug");
const templateSignIn = pug.compileFile("./src/templates/signin.pug");
const templateSignUp = pug.compileFile("./src/templates/signup.pug");
const templateProfile = pug.compileFile("./src/templates/profile.pug");
const templateBookings = pug.compileFile("./src/templates/bookings.pug");
const templateNewBooking = pug.compileFile("./src/templates/new-booking.pug");
const templateAdmin = pug.compileFile("./src/templates/admin.pug");

app.get("/", async (req, res) => {
  const { user } = await validateSessionToken(req.cookies.token);

  if (user) {
    res.redirect("/bookings");
    return;
  }

  res.send(templateIndex());
});

app.get("/admin", async (req, res) => {
  const { user } = await validateSessionToken(req.cookies.token);

  const users = await getAllUsers();

  if (!user) {
    res.redirect("/signin");
    return;
  }

  if (!user.isAdmin) {
    res.redirect("/bookings");
    return;
  }

  res.send(templateAdmin({ user, users}));
});

app.get("/bookings", async (req, res) => {
  const { user } = await validateSessionToken(req.cookies.token);

  if (!user) {
    res.redirect("/signin");
    return;
  }

  res.send(
    templateBookings({ user }),
  );
});

app.get("/new-booking", async (req, res) => {
  const { user } = await validateSessionToken(req.cookies.token);

  if (!user) {
    res.redirect("/signin");
    return;
  }

  res.send(
    templateNewBooking({ user }),
  );
});

app.get("/profile", async (req, res) => {
  const { user } = await validateSessionToken(req.cookies.token);

  if (!user) {
    res.redirect("/signin");
    return;
  }

  res.send(
    templateProfile({ user }),
  );
});

app.get("/signin", (req, res) => {
  res.send(templateSignIn());
});

app.get("/signup", (req, res) => {
  res.send(templateSignUp());
});

app.post("/signin", async (req, res) => {
  const username = req.body.username;

  const user = await getUser(username);

  if (!user) {
    res.status(400).send("Invalid username or password");
    return;
  }

  const password = req.body.password;

  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const passwordHash = encodeHex(hashBuffer);

  if (user?.passwordHash !== passwordHash) {
    res.status(400).send("Invalid username or password");
    return;
  }

  const token = generateSessionToken();
  await createSession(token, user.id);

  res
    .writeHead(200, {
      "Set-Cookie": `token=${token}; HttpOnly`,
      "Access-Control-Allow-Credentials": "true",
    })
    .redirect("/bookings");
});

app.post("/signout", (req, res) => {
  res
    .writeHead(200, {
      "Set-Cookie":
        `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`,
      "Access-Control-Allow-Credentials": "true",
      "HX-Redirect": "/signin"
    })
    .send();
});

app.post("/signup", [
  body("username").notEmpty().custom(async (value, { req, loc, path }) => {
    if (await userExists(value)) {
      throw new Error("A user with this username already exists");
    } else {
      return value;
    }
  }),
  body("password").notEmpty(),
  body("passwordConfirmation").custom((value, { req, loc, path }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords don't match");
    } else {
      return value;
    }
  }),
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const username = req.body.username;
  const password = req.body.password;

  const user = await createUser(username, password);
  const token = generateSessionToken();
  await createSession(token, user.id);

  res
    .writeHead(200, {
      "Set-Cookie": `token=${token}; HttpOnly`,
      "Access-Control-Allow-Credentials": "true",
    })
    .redirect("/bookings");
});

app.listen(8000);

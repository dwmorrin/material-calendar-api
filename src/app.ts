import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config({ path: ".env" }));

import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import morgan from "morgan";

import { login } from "./utils/login";
import { logout } from "./utils/logout";
import apiRouter from "./api.router";

// configure express
const app = express();
app.set("port", process.env.PORT || 5000);

// configure session
if (
  typeof process.env.SESSION_SECRET !== "string" ||
  process.env.SESSION_SECRET.length < 24
) {
  console.error("session secret not set or too short, aborting");
  process.exit(1);
}
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// configure global logging
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// express middleware for parsing JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/login", login);
app.post("/logout", logout);

// application routing
const loginGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) return res.status(401).send("not logged in");
  next();
};
app.use("/api", loginGuard, apiRouter);

// if nothing else...
app.use((req, res) => {
  console.warn(`Unhandled request for ${req.originalUrl}`);
  res
    .status(500)
    .json({ error: { code: 500, message: "couldnt handle your request" } });
});

export default app;

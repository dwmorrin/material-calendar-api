import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config({ path: ".env" }));

import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import morgan from "morgan";

import { login } from "./utils/login";
import { logout } from "./utils/logout";
import apiRouter from "./api.router";

import backup from "./utils/backup";

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
  if (process.env.NODE_ENV !== "development" && !req.session?.user?.id)
    return res.status(401).send("not logged in");
  next();
};
app.use("/api", loginGuard, apiRouter);

// catch unhandled requests
app.use((req, res) => {
  res.status(404).json({
    error: { code: 404, message: `nothing found for ${req.originalUrl}` },
  });
});

export default app;

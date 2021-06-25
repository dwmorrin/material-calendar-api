import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config({ path: ".env" }));

import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";

import apiRouter from "./api.router";
import { login } from "./utils/login";

// configure express
const app = express();
app.disable("x-powered-by");
app.set("port", process.env.PORT || 5000);

// configure global logging
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// express middleware for parsing JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// application routing
const loginGuard = (req: Request, res: Response, next: NextFunction) => {
  // allow developer to hard code a username into the .env file
  if (process.env.NODE_ENV === "development") {
    if (process.env.NET_ID) req.headers.netId = process.env.NET_ID;
    else return res.status(500).json({ error: "NET_ID not set in .env" });
  }
  if (req.headers.netId) next();
  else res.status(401).send("not logged in");
};
app.use("/", loginGuard);

app.use("/login", login);
app.use("/api", apiRouter);

// catch unhandled requests
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 404,
      message: `nothing found for ${req.method} ${req.originalUrl}`,
    },
  });
});

export default app;

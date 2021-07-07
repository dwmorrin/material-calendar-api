import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config({ path: ".env" }));

import express from "express";
import morgan from "morgan";

import apiRouter from "./api.router";
import authentication from "./utils/authentication";
import authorization from "./utils/authorization";
import login from "./utils/login";

// configure express
const app = express();
app.disable("x-powered-by");
app.set("port", process.env.PORT || 5000);

// configure global logging
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// express middleware for parsing JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// auth
app.use(authentication, authorization); // adds res.locals.authId

// application routing
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

import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config({ path: ".env" }));

import express, { Request, Response, NextFunction } from "express";
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
// increased limit for large data import files, e.g. events
app.use(express.json({ limit: "100mb" }));
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

// catch unhandled exceptions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: Request, res: Response, _: NextFunction): void => {
  // eslint-disable-next-line no-console
  console.error(
    [
      "--- UNHANDLED EXCEPTION ---",
      "** Error message: **",
      error.message,
      "** Error stack: **",
      error.stack,
      "--- END UNHANDLED EXCEPTION ---",
    ].join("\n")
  );
  res.status(500).json({
    error:
      process.env.NODE_ENV === "development"
        ? { message: error.message, stack: error.stack }
        : { message: "Something went wrong" },
    context: req.query.context,
  });
});

export default app;

import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
dotenvExpand(dotenv.config({ path: ".env" }));

import express, { Request, Response, NextFunction } from "express";
import syntaxError from "./utils/syntaxError";
import morgan from "morgan";
import cookieSession from "cookie-session";

import apiRouter from "./api.router";
import authentication from "./utils/authentication";
import authorization, { onNotAuthorized } from "./utils/authorization";
import password from "./utils/password";
import login from "./utils/login";
import logout from "./utils/logout";

// configure express
const app = express();
app.disable("x-powered-by");
app.set("port", process.env.PORT || 5000);

// configure global logging
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// configure session
app.use(
  cookieSession({
    name: "session",
    secret: process.env.SESSION_SECRET,
  })
);

// express middleware for parsing JSON data
// increased limit for large data import files, e.g. events
app.use(express.json({ limit: "100mb" }), syntaxError);
app.use(express.urlencoded({ extended: true }));

// initial user authentication, starts an auth session if valid
app.use("/login", authentication, password, authorization, login);
// destroys the session
app.use("/logout", logout);

// auth adds res.locals.authId and res.locals.user for /api routes
app.use(authentication, authorization, onNotAuthorized);

// application routing
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
app.use(
  (
    error: Error | string,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _: NextFunction
  ): void => {
    if (error instanceof Error) {
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
    } else {
      // eslint-disable-next-line no-console
      console.error(
        [
          "--- UNHANDLED EXCEPTION ---",
          "** Error message: **",
          JSON.stringify(error),
          "--- END UNHANDLED EXCEPTION ---",
        ].join("\n")
      );
      res.status(500).json({
        error:
          process.env.NODE_ENV === "development"
            ? { message: JSON.stringify(error) }
            : { message: "Something went wrong" },
        context: req.query.context,
      });
    }
  }
);

export default app;

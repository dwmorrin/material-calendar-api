import pool, { inflate } from "./db";
import { EC, EEH } from "./types";
import { addResultsToResponse } from "./crud";
import authorization from "./authorization";

const checkForSession: EC = (req, res, next) => {
  if (process.env.AUTH_METHOD === "DOT_ENV_AUTH_ID") {
    const authId = process.env.AUTH_ID;
    if (authId) {
      res.locals.authId = authId;
      return next();
    }
    return res.status(500).json({ error: "AUTH_ID not set in .env" });
  }
  const session = req.session as { authId?: string };
  if (session.authId) {
    res.locals.authId = session.authId;
    return next();
  }
  if (req.method !== "POST") {
    return res.status(401).json({ error: { message: "Send credentials" } });
  }
  const { username, password } = req.body;
  if (username && password) {
    return next("password");
  }
  return res.status(401).json({ error: { message: "Send credentials" } });
};

const usePassword: EEH = (err, req, res, next) => {
  if (err === "password") {
    const { username, password } = req.body;
    return pool.query(
      `SELECT
      cast_to_bool(
        password = AES_ENCRYPT(?, UNHEX(SHA2(?, 512)))
      ) AS passwordsMatch FROM user WHERE user_id = ?`,
      [password, process.env.MYSQL_SHA2_PASSPHRASE, username],
      (err, result) => {
        if (err) return next(err);
        const { passwordsMatch } = result[0];
        if (typeof passwordsMatch === "boolean" && passwordsMatch) {
          const session = req.session as { authId?: string };
          session.authId = username; // this will allow access to /api/*
          res.locals.authId = username;
          return next();
        }
        return res.status(401).send("not authenticated");
      }
    );
  }
  return next(err);
};

const getOne: EC = (_, res, next) =>
  pool.query(
    "SELECT * FROM user_view WHERE id = ?",
    [res.locals.user.id],
    addResultsToResponse(res, next)
  );

const updateLastLogin: EC = (_, res, next) =>
  pool.query(
    "UPDATE user SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
    [res.locals.user.id],
    addResultsToResponse(res, next, { key: "ignore" })
  );

const response: EC = (req, res, next) => {
  const { context } = req.query;
  const user = inflate(res.locals.results[0]);
  if (!user || !user.id) return next(new Error("Not authorized"));
  res.json({ data: user, context });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleAuthError: EEH = (err, req, res, _) =>
  res.status(500).json({
    error: {
      code: 500,
      message: err instanceof Error ? err.message : "authentication error",
    },
    context: req.query.context,
  });

export default [
  // add res.locals.authId or 401
  checkForSession,
  usePassword,
  // add res.locals.user or 401
  authorization,
  // respond with user data
  getOne,
  updateLastLogin,
  response,
  handleAuthError,
];

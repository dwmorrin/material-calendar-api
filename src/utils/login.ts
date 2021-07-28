import pool, { inflate } from "./db";
import { EC, EEH } from "./types";
import { addResultsToResponse } from "./crud";
import { passwordAuth } from "./authentication";

const usePassword: EEH = (err, _, __, next) => {
  if (err === "password") return next();
  next(err);
};

const getOne: EC = (_, res, next) => {
  // decide if we need to authenticate
  if (res.locals.user) {
    return pool.query(
      "SELECT * FROM user_view WHERE id = ?",
      [res.locals.user.id],
      addResultsToResponse(res, next)
    );
  }
  // jump to password handler
  next("password");
};

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
  getOne,
  updateLastLogin,
  response,
  usePassword,
  passwordAuth,
  handleAuthError,
];

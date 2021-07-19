import pool, { inflate } from "./db";
import { userQueryFn } from "../resources/user/user.query";
import { EC, EEH } from "./types";
import { addResultsToResponse } from "./crud";

const getOne: EC = (_, res, next) =>
  pool.query(
    userQueryFn("WHERE u.id = ?"),
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
const handleAuthError: EEH = (err, req, res, next) =>
  res.status(500).json({
    error: {
      code: 500,
      message: err instanceof Error ? err.message : "authentication error",
    },
    context: req.params.context,
  });

export default [getOne, updateLastLogin, response, handleAuthError];

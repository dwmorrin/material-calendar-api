import pool, { inflate } from "./db";
import { EC, EEH } from "./types";
import { addResultsToResponse } from "./crud";

const NotAuthenicated = "Not authenticated";

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
  if (!user || !user.id) return next(NotAuthenicated);
  res.json({ data: user, context });
};

const handleAuthError: EEH = (err, req, res, next) => {
  if (err === NotAuthenicated) {
    res.status(401).json({
      error: {
        code: 401,
        message: err,
      },
      context: req.query.context,
    });
  } else next(err);
};

export default [getOne, updateLastLogin, response, handleAuthError];

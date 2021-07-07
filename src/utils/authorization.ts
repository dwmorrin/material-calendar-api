import { Request, Response, NextFunction } from "express";
import pool, { error500 } from "./db";

export const error403 = Object.freeze({
  error: {
    code: 403,
    message: "not authorized",
  },
});

/**
 * If user ID exists in the database, adds
 * res.locals.user: {id, userId, userType} and
 * res.locals.admin: boolean
 * {@link http://expressjs.com/en/api.html#res.locals}
 */
const authorization = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // assumes authentication has already added res.locals.authId
  pool.query(
    "SELECT id, user_id, user_type FROM user WHERE user_id = ?",
    [res.locals.authId],
    (error, results) => {
      if (error)
        return res.status(500).json(error500(error, req.params.context));
      const user = results[0];
      if (!user) return res.status(403).json(error403);
      res.locals.user = {
        id: user.id,
        userId: user.user_id,
        userType: user.user_type,
      };
      res.locals.admin = user.user_type > 1;
      return next();
    }
  );
};

export default authorization;

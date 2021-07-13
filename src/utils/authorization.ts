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
    `SELECT
      u.id, u.user_id, JSON_ARRAYAGG(r.title) as roles
    FROM user u
      INNER JOIN user_role ur ON ur.user_id = u.id
      INNER JOIN role r ON ur.role_id = r.id
    WHERE u.user_id = ?`,
    [res.locals.authId],
    (error, results) => {
      if (error)
        return res.status(500).json(error500(error, req.params.context));
      const user = results[0];
      if (!user) return res.status(403).json(error403);
      res.locals.user = {
        id: user.id,
        userId: user.user_id,
        roles: JSON.parse(user.roles),
      };
      res.locals.admin = user.roles.includes("admin");
      return next();
    }
  );
};

export default authorization;

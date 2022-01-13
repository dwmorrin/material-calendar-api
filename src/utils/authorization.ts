import pool from "./db";
import { EC, EEH } from "./types";

export const NotAuthorized = "Not authorized";

/**
 * If user ID exists in the database, adds
 * res.locals.user: {id, userId, userType} and
 * res.locals.admin: boolean
 * {@link http://expressjs.com/en/api.html#res.locals}
 */
const authorization: EC = (_, res, next) => {
  // assumes authentication has already added res.locals.authId
  pool.query(
    `SELECT
      u.id,
      u.user_id,
      u.restriction,
      JSON_ARRAYAGG(r.title) AS roles
    FROM user u
      INNER JOIN user_role ur ON ur.user_id = u.id
      INNER JOIN      role r  ON ur.role_id = r.id
    WHERE u.user_id = ?`,
    [res.locals.authId],
    (error, results) => {
      if (error) return next(error); // unexpected error
      const user = results[0];
      if (!user?.id) return next(NotAuthorized);
      const roles = JSON.parse(user.roles);
      if (!Array.isArray(roles)) return next(NotAuthorized);
      res.locals.user = {
        id: user.id,
        userId: user.user_id,
        restriction: Number(user.restriction) || 0,
        roles,
      };
      res.locals.admin = user.roles.includes("admin");
      return next();
    }
  );
};

export const onNotAuthorized: EEH = (error, req, res, next) => {
  if (typeof error === "string" && error.includes(NotAuthorized)) {
    // end cookie session in case client has out-dated auth cookie
    // TODO this still requires user to try login twice to get a new cookie
    const request = req as unknown as { session: null };
    request.session = null;
    res.status(403).json({
      error: { code: 403, message: NotAuthorized },
      context: req.query.context,
    });
  } else next(error);
};

export default authorization;

import { EC } from "./types";
import pool from "./db";

export const passwordAuth: EC = (req, res, next) => {
  const { username, password } = req.body;
  pool.query(
    `SELECT
      cast_to_bool(
        password = AES_ENCRYPT(?, UNHEX(SHA2(?, 512)))
      ) AS passwordsMatch FROM user WHERE user_id = ?`,
    [password, process.env.MYSQL_SHA2_PASSPHRASE, username],
    (err, result) => {
      if (err) return next(err);
      const { passwordsMatch } = result.rows[0];
      if (typeof passwordsMatch === "boolean" && passwordsMatch) {
        const session = req.session as { authId?: string };
        session.authId = username;
        res.locals.authId = username;
        return next();
      }
      return res.status(401).send("not authenticated");
    }
  );
};

/**
 * If user is authenticated, adds res.locals.authId: string
 * {@link http://expressjs.com/en/api.html#res.locals}
 */
const authentication: EC = (req, res, next) => {
  // if the user has already been authenticated, pass through
  const session = req.session as { authId?: string };
  if (session.authId) {
    res.locals.authId = session.authId;
    return next();
  }
  switch (process.env.AUTH_METHOD) {
    // development: use an ID in the .env file
    case "DOT_ENV_AUTH_ID": {
      const authId = process.env.AUTH_ID;
      if (authId) {
        res.locals.authId = authId;
        return next();
      }
      return res.status(500).json({ error: "AUTH_ID not set in .env" });
    }
    // have the web server handle authentication and inject the authId into the request
    case "CUSTOM_HEADER": {
      if (typeof process.env.AUTH_CUSTOM_HEADER !== "string")
        return res
          .status(500)
          .json({ error: "authentication method misconfigured" });
      const authId = req.headers[process.env.AUTH_CUSTOM_HEADER.toLowerCase()];
      if (!authId) {
        return res.status(401).send("not authenticated");
      }
      res.locals.authId = authId;
      return next();
    }
    // use password authentication
    default:
      passwordAuth(req, res, next);
  }
};

export default authentication;

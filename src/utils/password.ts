import { EEH } from "./types";
import pool from "./db";

/**
 * Optional password authentication middleware.
 * Preceding function should call next("password") to enter this function.
 * If the provided username and password match with the database,
 * this adds the username to req.session.authId and res.locals.authId.
 */
const password: EEH = (err, req, res, next) => {
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
        if (!Array.isArray(result) || result.length !== 1)
          return res.status(401).json({ error: "Invalid credentials" });
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

export default password;

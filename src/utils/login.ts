import { Request, Response } from "express";
import pool, { error500, inflate } from "./db";
import { userQueryFn } from "../resources/user/user.query";

/**
 * Assumes user has already been authenticated and authorization already
 * checked that the user exists in the database.
 */
const login = (req: Request, res: Response): void => {
  const handleAuthError = () => {
    res
      .status(500)
      .json({ error: { code: 500, message: "authentication error" }, context });
  };
  const { context } = req.query;
  if (!res.locals?.user?.id) return handleAuthError();
  pool.query(
    userQueryFn("WHERE u.id = ?"),
    [res.locals.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json(error500(err, context));
      }
      const [user] = rows;
      if (!user) return handleAuthError();
      res.json({ data: inflate(user), context });
    }
  );
};

export default login;

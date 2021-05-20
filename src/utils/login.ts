import { Request, Response } from "express";
import pool, { error500, inflate } from "./db";
import { userQueryFn } from "../resources/user/user.query";

export const login = (req: Request, res: Response): void => {
  const { netId } = req.headers;
  if (!netId) return res.status(400).end();
  pool.query(userQueryFn("WHERE u.user_id = ?"), [netId], (err, rows) => {
    const { context } = req.query;
    if (err) {
      return res.status(500).json(error500(err, context));
    }
    const [user] = rows;
    if (!user) {
      return res
        .status(401)
        .json({ error: { code: 401, message: "invalid credentials" } });
    }
    res.json({ data: inflate(user), context });
  });
};

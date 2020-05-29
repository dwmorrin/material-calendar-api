import { Request, Response } from "express";
import pool, { error500 } from "./db";

export const login = (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).end();
  }
  const query = `
  SELECT
    id,
    firstName,
    lastName,
    role,
    JSON_ARRAYAGG(group_id) AS 'groupIds',
    JSON_ARRAYAGG(project_id) AS 'projectIds'
  FROM
    user_info
  WHERE
    id = ?;
  `;
  pool.query(query, [username], (err, rows) => {
    if (err) {
      return res.status(500).json(error500(err));
    }
    const [user] = rows;
    if (!user.id) {
      return res
        .status(401)
        .json({ error: { code: 401, message: "invalid credentials" } });
    }
    if (req.session) {
      req.session.userId = user.id;
    }
    res.json({ data: user, context: req.query.context });
  });
};

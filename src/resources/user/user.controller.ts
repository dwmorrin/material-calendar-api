import { Request, Response } from "express";
import pool, { error500 } from "../../utils/db";
import { controllers } from "../../utils/crud";

export const getGroups = (req: Request, res: Response) => {
  pool.query("SELECT * FROM group_memebers", (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res.status(200).json({ data: rows, context: req.query.context });
  });
};

export const getOneGroup = (req: Request, res: Response) => {
  pool.query(
    "SELECT * FROM group_memebers WHERE groupId = ?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res.status(200).json({ data: rows, context: req.query.context });
    }
  );
};

export const getOne = (req: Request, res: Response) => {
  pool.query(
    `
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
  `,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res.status(200).json({ data: rows[0], context: req.query.context });
    }
  );
};

export default { ...controllers("user", "id"), getOne, getGroups, getOneGroup };

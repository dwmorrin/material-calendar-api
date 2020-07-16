import { Request, Response } from "express";
import pool, { error500, mapKeysToBool } from "../../utils/db";
import { controllers } from "../../utils/crud";

const makeActiveBoolean = mapKeysToBool("active");

const query = `
  SELECT
    id,
    name AS title,
    start,
    end,
    active
  FROM
    semester
`;

export const getCurrent = (req: Request, res: Response) =>
  pool.query(
    query + " WHERE id = (SELECT MAX(id) FROM semester)",
    (err, rows) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: makeActiveBoolean(rows[0]), context });
    }
  );

export const getMany = (req: Request, res: Response) =>
  pool.query(query, (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows.map(makeActiveBoolean), context });
  });

export default { ...controllers("semester", "id"), getCurrent, getMany };

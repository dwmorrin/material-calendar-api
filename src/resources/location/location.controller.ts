import { Request, Response } from "express";
import { controllers } from "../../utils/crud";
import pool, { error500, inflate } from "../../utils/db";

const query = `
  SELECT
    s.id,
    s.name AS title,
    s.location AS groupId,
    IF(wh.id IS NOT NULL,
      JSON_ARRAYAGG(JSON_OBJECT(
        'id', wh.id,
        'date', wh.week_date,
        'hours', wh.hour
      )),
      JSON_ARRAY()
	) AS hours
  FROM
    studio s
    LEFT JOIN weekday_hour wh ON s.id = wh.studio_id
  GROUP BY s.id
`;

export const getMany = (req: Request, res: Response) =>
  pool.query(query, (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows.map(inflate), context });
  });

export const getOne = (req: Request, res: Response) =>
  pool.query(query + "WHERE id = ?", [req.params.id], (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: inflate(rows[0]), context });
  });

export const getDefaultId = (req: Request, res: Response) =>
  pool.query(
    "SELECT id FROM studio WHERE id = (SELECT MIN(id) FROM studio)",
    (err, rows) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: rows[0], context });
    }
  );

export default {
  ...controllers("studio", "id"),
  getMany,
  getOne,
  getDefaultId,
};

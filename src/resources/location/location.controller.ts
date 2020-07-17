import { Request, Response } from "express";
import { controllers, onResult } from "../../utils/crud";
import pool, { inflate } from "../../utils/db";

const queryFn = (where = "") => `
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
  ${where}
  GROUP BY s.id
`;

export const getMany = (req: Request, res: Response) =>
  pool.query(queryFn(), onResult({ req, res, dataMapFn: inflate }).read);

export const getOne = (req: Request, res: Response) =>
  pool.query(
    queryFn("WHERE s.id = ?"),
    [req.params.id],
    onResult({ req, res, take: 1 }).read
  );

export const getDefaultId = (req: Request, res: Response) =>
  pool.query(
    "SELECT id FROM studio WHERE id = (SELECT MIN(id) FROM studio)",
    onResult({ req, res, take: 1 }).read
  );
  );

export default {
  ...controllers("studio", "id"),
  getMany,
  getOne,
  getDefaultId,
};

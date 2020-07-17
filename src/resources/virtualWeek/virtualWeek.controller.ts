import { Request, Response } from "express";
import pool, { error500 } from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";

const getManyQuery = `
SELECT
  id,
  start,
  end,
  studio_id AS locationId,
  -1 AS 'locationHours',
  -1 AS 'projectHours'
FROM
  virtual_week
`;

const calculatedHoursQuery = `
SELECT
  v.id,
  v.start,
  v.end,
  v.studio_id AS locationId,
  (
    SELECT
      SUM(IF(w.week_date BETWEEN v2.start AND v2.end, w.hour, 0)) as hours
    FROM
      virtual_week v2
      JOIN weekday_hour w ON w.studio_id = v2.studio_id
    WHERE
      v2.studio_id = ? AND v.id = v2.id
    GROUP BY
      v2.id
  ) AS 'locationHours',
  SUM(IF(
	pa.start = v.start AND pa.end = v.end,
    pa.hour,
    0
  )) AS 'projectHours'
FROM
  virtual_week v
  JOIN project p ON p.studio_id = v.studio_id
  JOIN project_allotment pa ON pa.project_id = p.id
WHERE
  v.studio_id = ?
GROUP BY v.id
`;

export const getOne = (req: Request, res: Response) => {
  pool.query(
    calculatedHoursQuery,
    [req.params.id, req.params.id],
    (err, rows) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: rows, context });
    }
  );
};

export const getMany = (req: Request, res: Response) =>
  pool.query(getManyQuery, onResult({ req, res }).read);

export default {
  ...controllers("virtual_week", "id"),
  getMany,
  getOne,
};

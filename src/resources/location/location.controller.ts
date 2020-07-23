import { Request, Response } from "express";
import { controllers, onResult } from "../../utils/crud";
import pool, { inflate, error500 } from "../../utils/db";

const queryFn = (where = "") => `
  SELECT
    s.id,
    s.name AS title,
    s.location AS groupId,
    IF(wh.id IS NOT NULL,
      JSON_ARRAYAGG(JSON_OBJECT(
        'id', wh.id,
        'date', wh.week_date,
        'hours', wh.hour,
        'start', wh.start,
        'end', wh.end
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

const calculatedVirtualWeekHoursQuery = `
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

export const getVirtualWeeks = (req: Request, res: Response) =>
  pool.query(
    calculatedVirtualWeekHoursQuery,
    [req.params.id, req.params.id],
    onResult({ req, res }).read
  );

const replaceHoursQuery = `
REPLACE INTO weekday_hour
  (hour, week_date, semester_id, studio_id, start, end)
VALUES ?
`;

const flattenHours = (hours: { [k: string]: string | number }) => [
  hours.hours,
  hours.date,
  hours.semesterId,
  hours.locationId,
  hours.start,
  hours.end,
];

export const createOrUpdateHours = (req: Request, res: Response) =>
  pool.query(replaceHoursQuery, [req.body.map(flattenHours)], (err, data) => {
    if (err) return res.status(500).json(error500(err, req.query.context));
    res.status(201).json({ data, context: req.query.context });
  });

export default {
  ...controllers("studio", "id"),
  createOrUpdateHours,
  getMany,
  getOne,
  getDefaultId,
  getVirtualWeeks,
};

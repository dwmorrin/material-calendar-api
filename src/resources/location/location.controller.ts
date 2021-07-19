import { addResultsToResponse, controllers } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

const queryFn = (where = "") => `
  SELECT
    s.id,
    s.title,
    s.location AS groupId,
    IF (
      wh.date IS NULL,
      '[]',
      JSON_ARRAYAGG(JSON_OBJECT(
        'date', wh.date,
        'hours', wh.hours
      ))
    ) AS hours,
    s.restriction AS restriction
  FROM
    studio s
    LEFT JOIN studio_hours wh ON s.id = wh.studio_id
  ${where}
  GROUP BY s.id
`;

export const getMany: EC = (_, res, next) =>
  pool.query(queryFn(), addResultsToResponse(res, next));

export const getOne: EC = (req, res, next) =>
  pool.query(
    queryFn("WHERE s.id = ?"),
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

export const getDefaultId: EC = (_, res, next) =>
  pool.query(
    "SELECT id FROM studio WHERE id = (SELECT MIN(id) FROM studio)",
    addResultsToResponse(res, next, { one: true })
  );

const calculatedVirtualWeekHoursQuery = `
SELECT
  v.id,
  v.start,
  v.end,
  v.studio_id AS locationId,
  (
    SELECT
      SUM(IF(w.date BETWEEN v2.start AND v2.end, w.hours, 0)) as hours
    FROM
      virtual_week v2
      JOIN studio_hours w ON w.studio_id = v2.studio_id
    WHERE
      v2.studio_id = ? AND v.id = v2.id
    GROUP BY
      v2.id
  ) AS 'locationHours',
  SUM(IF(
	pa.virtual_week_id = v.id,
    pa.hours,
    0
  )) AS 'projectHours'
FROM
  virtual_week v
  JOIN project_virtual_week_hours pa ON pa.virtual_week_id = v.id
WHERE
  v.studio_id = ?
GROUP BY v.id
`;

export const getVirtualWeeks: EC = (req, res, next) =>
  pool.query(
    calculatedVirtualWeekHoursQuery,
    [req.params.id, req.params.id],
    addResultsToResponse(res, next)
  );

export const createOrUpdateHours: EC = (req, res, next) =>
  pool.query(
    "REPLACE INTO studio_hours (studio_id, date, hours) VALUES ?",
    [
      (req.body as { date: string; hours: number }[]).map(({ date, hours }) => [
        req.params.id,
        date,
        hours,
      ]),
    ],
    (err, data) => {
      if (err) return next(err);
      res.status(201).json({ data, context: req.query.context });
    }
  );

export const createOne: EC = (req, res, next): void => {
  pool.query(
    "INSERT INTO studio SET ?",
    [
      {
        title: req.body.title,
        location: req.body.groupId,
        restriction: req.body.restriction,
      },
    ],
    addResultsToResponse(res, next)
  );
};

// returns sum of event hours in a location
export const sumHours: EC = (req, res, next) =>
  pool.query(
    `SELECT
      id AS locationId,
      DATE(start) as date,
      SUM(TIMESTAMPDIFF(HOUR, start, end)) AS hours
    FROM allotment
    WHERE studio_id = ?
    GROUP BY YEAR(start), MONTH(start), DAY(start)
    `,
    [req.params.id],
    addResultsToResponse(res, next)
  );

export default {
  ...controllers("studio", "id"),
  createOne,
  createOrUpdateHours,
  getMany,
  getOne,
  getDefaultId,
  getVirtualWeeks,
  sumHours,
};

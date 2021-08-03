import {
  addResultsToResponse,
  controllers,
  withResource,
} from "../../utils/crud";
import pool, { inflate } from "../../utils/db";
import { EC } from "../../utils/types";

/**
 * Reading: use `location` view
 * Writing: use `studio` table
 */

export const getMany: EC = (_, res, next) =>
  pool.query("SELECT * from location", addResultsToResponse(res, next));

export const getOne: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM location WHERE id = ?",
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

const createOrUpdateHours: EC = (req, res, next) =>
  pool.query(
    "REPLACE INTO studio_hours (studio_id, date, hours) VALUES ?",
    [
      (req.body as { date: string; hours: number }[]).map(({ date, hours }) => [
        req.params.id,
        date,
        hours,
      ]),
    ],
    addResultsToResponse(res, next)
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

const bulkHoursResponse: EC = (req, res) =>
  res.status(201).json({
    data: {
      locations: res.locals.locations.map(inflate),
      virtualWeeks: res.locals.virtualWeeks.map(inflate),
    },
    context: req.query.context,
  });

const updateOne: EC = (req, res, next) => {
  const { id } = req.params;
  const { title, groupId, restriction, allowsWalkIns } = req.body;
  pool.query(
    "UPDATE studio SET ? WHERE id = ?",
    [
      { title, location: groupId, restriction, allows_walk_ins: allowsWalkIns },
      id,
    ],
    addResultsToResponse(res, next, { one: true })
  );
};

export default {
  ...controllers("studio", "id"),
  createOne,
  bulkLocationHours: [
    createOrUpdateHours,
    withResource("locations", "SELECT * FROM location"),
    withResource("virtualWeeks", "SELECT * FROM virtual_week_view"),
    bulkHoursResponse,
  ],
  getMany,
  getOne,
  getDefaultId,
  getVirtualWeeks,
  sumHours,
  updateOne,
};

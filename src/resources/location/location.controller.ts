import {
  addResultsToResponse,
  controllers,
  withResource,
} from "../../utils/crud";
import pool, { inflate } from "../../utils/db";
import { EC, EEH } from "../../utils/types";

/**
 * Reading: use `location_view` view
 * Writing: use `location` table
 */

export const getMany: EC = (_, res, next) =>
  pool.query("SELECT * FROM location_view", addResultsToResponse(res, next));

const getOne: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM location_view WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

const calculatedVirtualWeekHoursQuery = `
SELECT
  v.id,
  v.start,
  v.end,
  v.location_id AS locationId,
  (
    SELECT
      SUM(IF(w.date BETWEEN v2.start AND v2.end, w.hours, 0)) as hours
    FROM
      virtual_week v2
      JOIN location_hours w ON w.location_id = v2.location_id
    WHERE
      v2.location_id = ? AND v.id = v2.id
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
  v.location_id = ?
GROUP BY v.id
`;

const getVirtualWeeks: EC = (req, res, next) =>
  pool.query(
    calculatedVirtualWeekHoursQuery,
    [req.params.id, req.params.id],
    addResultsToResponse(res, next)
  );

const createOrUpdateHoursSetup: EC = (req, res, next) => {
  const dailyHours = req.body;
  if (!Array.isArray(dailyHours)) {
    return next("Expected array of daily hours");
  }
  res.locals.updates = dailyHours.filter(({ useDefault }) => !useDefault);
  res.locals.deletes = dailyHours.filter(({ useDefault }) => useDefault);
  next();
};

const createOrUpdateHours: EC = (req, res, next) => {
  if (!Array.isArray(res.locals.updates))
    return next("Daily hours update handler not configured.");
  if (!res.locals.updates.length) return next();
  pool.query(
    "REPLACE INTO location_hours (location_id, date, hours) VALUES ?",
    [
      (res.locals.updates as { date: string; hours: number }[]).map(
        ({ date, hours }) => [req.params.id, date, hours]
      ),
    ],
    addResultsToResponse(res, next)
  );
};

const deleteHours: EC = (req, res, next) => {
  if (!Array.isArray(res.locals.deletes))
    return next("Daily hours delete handler not configured.");
  if (!res.locals.deletes.length) return next();
  pool.query(
    "DELETE FROM location_hours WHERE location_id = ? AND date in (?)",
    [req.params.id, res.locals.deletes.map((d) => d.date)],
    addResultsToResponse(res, next, { key: "ignore" })
  );
};

const onHoursError: EEH = (err, _, res, next) => {
  if (typeof err === "string")
    return res.status(400).json({ error: { message: err } });
  else next(err);
};

const createOne: EC = (req, res, next) => {
  const { title, groupId, restriction, allowsWalkIns, defaultHours } = req.body;
  const defaultHoursValid = Object.values(defaultHours).every(
    (value) =>
      typeof value === "number" && !isNaN(value) && value >= 0 && value <= 24
  );
  if (!defaultHoursValid)
    return res.status(400).json({
      error: { message: "Default hours must be between 0 and 24" },
    });
  pool.query(
    "INSERT INTO location SET ?",
    [
      {
        title: title,
        location: groupId,
        restriction: restriction,
        allows_walk_ins: allowsWalkIns,
        default_hours_monday: defaultHours.monday,
        default_hours_tuesday: defaultHours.tuesday,
        default_hours_wednesday: defaultHours.wednesday,
        default_hours_thursday: defaultHours.thursday,
        default_hours_friday: defaultHours.friday,
        default_hours_saturday: defaultHours.saturday,
        default_hours_sunday: defaultHours.sunday,
      },
    ],
    addResultsToResponse(res, next, { one: true })
  );
};

// returns sum of event hours in a location
// TODO id AS locationId looks wrong - we are pulling from event table
export const sumHours: EC = (req, res, next) =>
  pool.query(
    `SELECT
      id AS locationId,
      DATE(start) as date,
      SUM(TIMESTAMPDIFF(HOUR, start, end)) AS hours
    FROM event
    WHERE location_id = ?
    GROUP BY YEAR(start), MONTH(start), DAY(start)
    `,
    [req.params.id],
    addResultsToResponse(res, next)
  );

const bulkHoursResponse: EC = (req, res) =>
  res.status(201).json({
    data: {
      locations: res.locals.locations.map(inflate),
    },
    context: req.query.context,
  });

const updateOne: EC = (req, res, next) => {
  const { id } = req.params;
  const { title, groupId, restriction, allowsWalkIns, defaultHours } = req.body;
  const defaultHoursValid = Object.values(defaultHours).every(
    (value) =>
      typeof value === "number" && !isNaN(value) && value >= 0 && value <= 24
  );
  if (!defaultHoursValid)
    return res.status(400).json({
      error: { message: "Default hours must be between 0 and 24" },
    });
  pool.query(
    "UPDATE location SET ? WHERE id = ?",
    [
      {
        title,
        location: groupId,
        restriction,
        allows_walk_ins: allowsWalkIns,
        default_hours_monday: defaultHours.monday,
        default_hours_tuesday: defaultHours.tuesday,
        default_hours_wednesday: defaultHours.wednesday,
        default_hours_thursday: defaultHours.thursday,
        default_hours_friday: defaultHours.friday,
        default_hours_saturday: defaultHours.saturday,
        default_hours_sunday: defaultHours.sunday,
      },
      id,
    ],
    addResultsToResponse(res, next, { one: true })
  );
};

export default {
  ...controllers("location", "id"),
  createOne,
  bulkLocationHours: [
    createOrUpdateHoursSetup,
    createOrUpdateHours,
    deleteHours,
    withResource("locations", "SELECT * FROM location_view"),
    bulkHoursResponse,
    onHoursError,
  ],
  getMany,
  getOne,
  getVirtualWeeks,
  sumHours,
  updateOne,
};

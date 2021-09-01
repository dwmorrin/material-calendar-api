import { Request } from "express";
import {
  QueryAssertion,
  controllers,
  crud,
  dataHandlers,
  query,
  respond,
} from "../../utils/crud";
import { EC, EEH } from "../../utils/types";

/**
 * Reading: use `location_view` view
 * Writing: use `location` table
 */

const getMany = crud.readMany(
  "SELECT * FROM location_view WHERE restriction <= ?",
  (_, res) => res.locals.user.restriction
);

const getOne = crud.readOne(
  "SELECT * FROM location_view WHERE id = ?",
  (req) => req.params.id
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

const createOrUpdateHours = query({
  assert: (_, res) => {
    if (!Array.isArray(res.locals.updates))
      throw "Daily hours update handler not configured.";
    if (!res.locals.updates.length) throw "continue";
  },
  sql: "REPLACE INTO location_hours (location_id, date, hours) VALUES ?",
  using: (req, res) => [
    (res.locals.updates as { date: string; hours: number }[]).map(
      ({ date, hours }) => [req.params.id, date, hours]
    ),
  ],
});

const deleteHours = query({
  assert: (_, res) => {
    if (!Array.isArray(res.locals.deletes))
      throw "Daily hours delete handler not configured.";
    if (!res.locals.deletes.length) throw "continue";
  },
  sql: "DELETE FROM location_hours WHERE location_id = ? AND date in (?)",
  using: (req, res) => [
    req.params.id,
    (res.locals.deletes as { date: string; hours: number }[]).map(
      ({ date }) => date
    ),
  ],
});

const onHoursError: EEH = (err, _, res, next) => {
  if (typeof err === "string")
    return res.status(400).json({ error: { message: err } });
  else next(err);
};

const assertDefaultHours: QueryAssertion = (req) => {
  const { defaultHours } = req.body;
  const defaultHoursValid = Object.values(defaultHours).every(
    (value) =>
      typeof value === "number" && !isNaN(value) && value >= 0 && value <= 24
  );
  if (!defaultHoursValid) throw "Default hours must be between 0 and 24";
};

const mapBodyToLocation = (req: Request) => {
  const { title, groupId, restriction, allowsWalkIns, defaultHours } = req.body;
  return {
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
  };
};

const createOne = [
  query({
    assert: assertDefaultHours,
    sql: "INSERT INTO location SET ?",
    using: mapBodyToLocation,
  }),
  respond({
    status: 201,
    data: dataHandlers.echoBodyWithInsertId,
  }),
];

const updateOne = [
  query({
    assert: assertDefaultHours,
    sql: "UPDATE location SET ? WHERE id = ?",
    using: (req) => [mapBodyToLocation(req), req.params.id],
  }),
  respond({
    status: 201,
    data: dataHandlers.echoBody,
  }),
];

export default {
  ...controllers("location", "id"),
  createOne,
  bulkLocationHours: [
    createOrUpdateHoursSetup,
    createOrUpdateHours,
    deleteHours,
    query({
      sql: "SELECT * FROM location_view",
      then: (results, _, res) => (res.locals.locations = results),
    }),
    respond({
      status: 201,
      data: (_, res) => ({
        locations: res.locals.locations,
      }),
    }),
    onHoursError,
  ],
  getMany,
  getOne,
  updateOne,
};

import { crud, query, respond } from "../../utils/crud";
import { EC } from "../../utils/types";

const createMany = [
  query({
    assert: (req) => {
      if (!(Array.isArray(req.body) && req.body.length))
        throw "create many without array of events";
    },
    sql: "REPLACE INTO event (start, end, location_id, bookable, description) VALUES ?",
    using: (req) => [
      req.body.map(
        ({
          start = "",
          end = "",
          locationId = 0,
          reservable = false,
          title = "",
        }) => [start, end, locationId, reservable, title]
      ),
    ],
  }),
  // TODO don't send ALL events; just enough to update view; i.e. get a range from client
  query({
    sql: "SELECT * FROM event_view",
    then: (results, _, res) => (res.locals.events = results),
  }),
  respond({
    status: 201,
    data: (_, res) => ({ events: res.locals.events }),
  }),
];

const updateOne = [
  query({
    sql: "UPDATE event SET ? WHERE id = ?",
    using: ({ body, params }) => [
      {
        start: body.start,
        end: body.end,
        location_id: body.locationId,
        bookable: body.reservable,
        description: body.title,
      },
      Number(params.id),
    ],
  }),
  query({
    sql: "SELECT * FROM event_view WHERE id = ?",
    using: (req) => Number(req.params.id),
    then: (results, _, res) => (res.locals.event = results[0]),
  }),
  respond({
    status: 201,
    data: (_, res) => ({ event: res.locals.event }),
  }),
];

// TODO: validation
const lockOne = [
  query({
    sql: "UPDATE event SET lock_user_id = ?, locked_time = NOW() WHERE id = ?",
    using: (req, res) => [res.locals.user.id, Number(req.params.id)],
  }),
  respond({
    status: 201,
    data: () => ({}),
  }),
];

const unlockValidation: EC = (_, res, next) => {
  if (!res.locals.lockUserId) return res.status(400).json({ error: "no lock" });
  const { id, isAdmin } = res.locals.user;
  if (res.locals.lockUserId !== id && !isAdmin)
    return res.status(400).json({ error: "not owner" });
  next();
};

const unlockOne = [
  query({
    sql: "SELECT lock_user_id FROM event WHERE id = ?",
    using: (req) => Number(req.params.id),
    then: (results, _, res) =>
      (res.locals.lockUserId = results[0].lock_user_id),
  }),
  unlockValidation,
  query({
    sql: "UPDATE event SET lock_user_id = NULL, locked_time = NULL WHERE id = ?",
    using: (req) => Number(req.params.id),
  }),
  query({
    sql: "SELECT * FROM event_view WHERE id = ?",
    using: (req) => Number(req.params.id),
  }),
  respond({
    status: 201,
    data: (_, res) => ({ event: res.locals.results[0] }),
  }),
];

export default {
  createOne: crud.createOne("INSERT INTO event ?", ({ body }) => body),
  createMany,
  deleteOne: crud.deleteOne("DELETE FROM event WHERE id = ?", (req) =>
    Number(req.params.id)
  ),
  getMany: crud.readMany("SELECT * FROM event_view"),
  getOne: crud.readOne("SELECT * FROM event_view WHERE id = ?", (req) =>
    Number(req.params.id)
  ),
  lockOne,
  unlockOne,
  updateOne,
  range: crud.readMany(
    "SELECT * FROM event_view WHERE a.start BETWEEN ? AND ?",
    ({ body }) => [body.start, body.end]
  ),
};

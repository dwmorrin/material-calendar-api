import { crud, query, respond } from "../../utils/crud";

const createMany = [
  query({
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
    status: 204,
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
  updateOne,
  range: crud.readMany(
    "SELECT * FROM event_view WHERE a.start BETWEEN ? AND ?",
    ({ body }) => [body.start, body.end]
  ),
};

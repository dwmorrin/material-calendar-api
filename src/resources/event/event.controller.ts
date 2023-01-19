import { crud, query, respond } from "../../utils/crud";

const getMany = [
  query({
    sql: [
      "SELECT start, end FROM semester",
      "WHERE id = (SELECT semester_id FROM active_semester)",
    ].join(" "),
    then: (results, _, res) => (res.locals.semester = results[0]),
  }),
  query({
    sql: ["SELECT * FROM event_view", "WHERE start BETWEEN ? AND ?"].join(" "),
    using: (_, res) => [
      res.locals.semester.start,
      res.locals.semester.end + " 23:59:59",
    ],
    then: (results, _, res) => (res.locals.events = results),
  }),
  respond({
    status: 200,
    data: (_, res) => res.locals.events,
  }),
];

interface Event {
  start: string;
  end: string;
  locationId: number;
  reservable: boolean;
  title: string;
}

interface BulkEventBody {
  events: Event[];
  range: { start: string; end: string };
}

//! assumes locationId, reservable, and title are the same for all
const createMany = [
  query({
    assert: (req) => {
      const { events, range } = req.body as BulkEventBody;
      if (!(Array.isArray(events) && events.length))
        throw "create many without array of events";
      if (![range.start, range.end].every((s) => s && typeof s === "string"))
        throw "no date range provided";
    },
    sql: "REPLACE INTO event (start, end, location_id, bookable, description) VALUES ?",
    using: (req) => {
      const { events } = req.body as BulkEventBody;
      return [
        events.map(
          ({
            start = "",
            end = "",
            locationId = 0,
            reservable = false,
            title = "",
          }) => [start, end, locationId, reservable, title]
        ),
      ];
    },
  }),
  query({
    sql: `
    SELECT * FROM event_view
    WHERE location->>'$.id' = ?
    AND start BETWEEN ? AND ADDDATE(?, 1)
    AND reservable = ?
    AND title = ?`,
    then: (results, _, res) => (res.locals.events = results),
    using: (req) => {
      const { events, range } = req.body as BulkEventBody;
      const { locationId, reservable, title } = events[0];
      return [locationId, range.start, range.end, +reservable, title];
    },
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

export default {
  createOne: crud.createOne("INSERT INTO event ?", ({ body }) => body),
  createMany,
  deleteOne: crud.deleteOne("DELETE FROM event WHERE id = ?", (req) =>
    Number(req.params.id)
  ),
  getMany,
  getManyById: [
    query({
      assert: (req) => {
        if (!Array.isArray(req.body.eventIds))
          throw "Requesting events by ID without 'eventIds' array";
      },
      sql: "SELECT * FROM event_view WHERE id IN (?)",
      using: (req) => [req.body.eventIds],
      then: (results, _, res) => (res.locals.events = results),
    }),
    respond({
      status: 200,
      data: (_, res) => ({ events: res.locals.events }),
    }),
  ],
  getOne: crud.readOne("SELECT * FROM event_view WHERE id = ?", (req) =>
    Number(req.params.id)
  ),
  updateOne,
  range: crud.readMany(
    "SELECT * FROM event_view WHERE start BETWEEN DATE(?) AND DATE(?)",
    ({ query: { start, end } }) => [start, end]
  ),
};

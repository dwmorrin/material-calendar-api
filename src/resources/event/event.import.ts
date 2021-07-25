import pool, { inflate } from "../../utils/db";
import { withResource } from "../../utils/crud";
import { EC, EEH } from "../../utils/types";
import controllers from "./event.controller";

const setup: EC = (req, res, next) => {
  const input = req.body;
  if (!input || !(Array.isArray(input) && input.length))
    return next("no input");
  res.locals.input = input;
  res.locals.inserts = [];
  res.locals.updates = [];
  next();
};
interface EventRecord {
  id: number;
  title: string;
  start: string;
  end: string;
  location: { id: number; title: string };
  reservable: number;
}

/**
 * req.body = {
 *   title: string,
 *   location: string,
 *   start: string,
 *   end: string
 *   reservable: number,
 * }[]
 */
const process: EC = (_, res, next) => {
  const { input, events = [] } = res.locals;
  // loops until input is empty
  if (!input || !input.length) return next();
  const locations = res.locals.locations as { id: number; title: string }[];
  const locationDict = locations.reduce((dict, l) => {
    dict[l.title] = l.id;
    return dict;
  }, {} as { [k: string]: number });
  try {
    const [inserts, updates] = (
      input as {
        id: number;
        title: string;
        start: string;
        end: string;
        locationId: string;
        reservable: number;
      }[]
    ).reduce(
      ([inserts, updates], e) => {
        const foundIndex = (events as EventRecord[]).findIndex(
          (ev) =>
            ev.location.title === e.locationId &&
            ev.start === e.start &&
            ev.end === e.end
        );
        if (foundIndex === -1) {
          if (!(e.locationId in locationDict))
            throw new Error(`${e.locationId}: location does not exist`);
          inserts.push({
            title: e.title,
            start: e.start,
            end: e.end,
            locationId: locationDict[e.locationId],
            reservable: e.reservable,
          });
        } else {
          updates.push(e);
          events.splice(foundIndex, 1);
        }
        return [inserts, updates];
      },
      [[], []] as Record<string, unknown>[][]
    );
    res.locals.inserts = inserts;
    res.locals.updates = updates;
    next();
  } catch (err) {
    if (err.message.includes("location does not exist"))
      return next(err.message);
    return next(err);
  }
};

const insert: EC = (req, res, next) =>
  pool.query(
    `REPLACE INTO allotment (
      start, end, studio_id, bookable, description
    ) VALUES ?`,
    [
      res.locals.inserts.map(
        ({
          start = "",
          end = "",
          locationId = 0,
          reservable = false,
          title = "",
        }) => [start, end, locationId, reservable, title]
      ),
    ],
    (err) => {
      if (err) return next(err);
      next();
    }
  );

const update: EC = (req, res, next) => {
  const { updates } = res.locals;
  if (!updates || !updates.length) return next();
  const event = updates.shift();
  pool.query(
    "UPDATE allotment SET ? WHERE id = ?",
    [
      {
        title: event.title,
        start: event.start,
        end: event.end,
        reservable: event.reservable,
        studio_id: event.location.id,
      },
      event.id,
    ],
    (err) => {
      if (err) return next(err);
      update(req, res, next);
    }
  );
};

// requires getMany to be run first to populate res.locals.results
const response: EC = (_, res) => {
  res.status(201).json({ data: res.locals.results.map(inflate) });
};

const onError: EEH = (err, _, res, next) => {
  if (typeof err === "string") {
    res.status(400).json({ error: { message: err } });
  } else {
    next(err);
  }
};

const eventQuery = `
SELECT
  id,
  description AS title,
  start,
  end,
  (
    SELECT JSON_OBJECT(
      'id', studio.id,
      'title', studio.title
    )
    FROM studio
    WHERE studio.id = studio_id
  ) AS location,
  bookable AS reservable
  FROM allotment
`;

export default [
  setup,
  withResource("events", eventQuery),
  withResource("locations", "SELECT id, title FROM studio"),
  process,
  insert,
  update,
  controllers.getMany,
  response,
  onError,
];

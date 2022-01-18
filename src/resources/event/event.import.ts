/* eslint-disable no-console */
import { Connection } from "mysql";
import { endTransaction, inflate, startTransaction } from "../../utils/db";
import { withResource } from "../../utils/crud";
import { EC, EEH } from "../../utils/types";
import controllers from "./event.controller";

// returned from withResource query
interface Location {
  id: number;
  title: string;
}

// returned from withResource query
interface Event {
  id: number;
  title: string;
  start: string;
  end: string;
  location: Location;
  reservable: boolean;
}

interface EventInputRecord {
  title: string;
  locationId: string; // actually locationTitle
  start: string;
  end: string;
  reservable: number;
}

interface EventRecord {
  id?: number;
  start: string;
  end: string;
  location_id: number;
  bookable: boolean;
  description: string;
}

type EventUpdate = Omit<EventRecord, "start" | "end" | "location_id">;

const setup: EC = (req, res, next) => {
  const input: EventInputRecord[] = req.body;
  if (!input || !(Array.isArray(input) && input.length))
    return next("no input");
  res.locals.input = input;
  res.locals.inserts = [];
  res.locals.updates = [];
  res.locals.seen = {};
  next();
};

const process: EC = (_, res, next) => {
  const input: EventInputRecord[] = res.locals.input;
  if (!input.length) return next();
  const locations: Location[] = res.locals.locations;
  const events: Event[] = res.locals.events;
  const locationDict = locations.reduce((dict, l) => {
    dict[l.title] = l.id;
    return dict;
  }, {} as { [k: string]: number });

  const [inserts, updates] = input.reduce(
    ([inserts, updates], { start, end, locationId, title, reservable }) => {
      const foundIndex = events.findIndex(
        (ev) =>
          ev.location.title === locationId &&
          ev.start === start &&
          ev.end === end
      );
      if (foundIndex === -1) {
        if (!(locationId in locationDict))
          throw new Error(`${locationId}: location does not exist`);
        inserts.push({
          description: title,
          start: start,
          end: end,
          location_id: locationDict[locationId],
          bookable: !!reservable,
        });
      } else {
        const existing = events[foundIndex];
        updates.push({
          description: title,
          bookable: !!reservable,
        });
        updates.push(existing.id);
      }
      return [inserts, updates];
    },
    [[], []] as [EventRecord[], (EventUpdate | number)[]]
  );
  res.locals.inserts = inserts;
  res.locals.updates = updates;
  next();
};

const insert: EC = (_, res, next) => {
  const inserts: EventRecord[] = res.locals.inserts;
  if (!inserts.length) return next();
  const connection: Connection = res.locals.connection;
  connection.query(
    "INSERT INTO event SET ?;".repeat(inserts.length),
    inserts,
    (err) => {
      if (err) return next(err);
      next();
    }
  );
};

const update: EC = (_, res, next) => {
  const updates: EventUpdate[] = res.locals.updates;
  if (!updates.length) return next();
  const connection: Connection = res.locals.connection;
  connection.query(
    "UPDATE event SET ? WHERE id = ?;".repeat(updates.length / 2),
    updates,
    (err) => {
      if (err) return next(err);
      next();
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
      'id', location.id,
      'title', location.title
    )
    FROM location
    WHERE location.id = location_id
  ) AS location,
  bookable AS reservable
  FROM event
`;

export default [
  setup,
  withResource("events", eventQuery),
  withResource("locations", "SELECT id, title FROM location"),
  process,
  ...startTransaction,
  insert,
  update,
  ...endTransaction,
  controllers.getMany,
  response,
  onError,
];

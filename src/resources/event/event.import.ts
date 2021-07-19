import pool from "../../utils/db";
import { withResource } from "../../utils/crud";
import { EC, EEH } from "../../utils/types";
import controllers from "./event.controller";

enum ErrorTypes {
  RepeatedEvent,
}

const errors: { [k: number]: string } = {
  [ErrorTypes.RepeatedEvent]: "repeated event",
};

const setup: EC = (req, res, next) => {
  const input = req.body;
  if (!input || !(Array.isArray(input) && input.length))
    return next("no input");
  res.locals.input = input;
  res.locals.inserts = [];
  res.locals.updates = [];
  next();
};

/**
 * req.body = {
 *   title: string,
 *   location: string,
 *   start: string,
 *   end: string
 *   reservable: number,
 * }[]
 */
const process: EC = (req, res, next) => {
  const { input, events = [] } = res.locals;
  if (!res.locals.seen) res.locals.seen = {};
  // loops until input is empty
  if (!input || !input.length) return next();
  const event = input.shift();
  const key = event.start + event.end + event.location;
  if (res.locals.seen[key]) return next(ErrorTypes.RepeatedEvent);
  res.locals.seen[key] = true;
  const existing = (
    events as {
      id: number;
      title: string;
      start: string;
      end: string;
      location: { id: number; title: string };
      reservable: number;
    }[]
  ).find(
    ({ start, end, location: { title } }) =>
      title === event.location && start === event.start && end === event.end
  );
  if (existing) res.locals.updates.push({ ...event, id: existing.id });
  else res.locals.inserts.push(event);
  process(req, res, next);
};

const insert: EC = (req, res, next) => {
  const { inserts } = res.locals;
  if (!inserts || !inserts.length) return next();
  const event = inserts.shift();
  pool.query("INSERT INTO allotment SET ?", [event], (err) => {
    if (err) return next(err);
    insert(req, res, next);
  });
};

const update: EC = (req, res, next) => {
  const { updates } = res.locals;
  if (!updates || !updates.length) return next();
  const event = updates.shift();
  pool.query(
    "UPDATE allotment SET ? WHERE id = ?",
    [event, event.id],
    (err) => {
      if (err) return next(err);
      update(req, res, next);
    }
  );
};

// requires getMany to be run first to populate res.locals.results
const response: EC = (_, res) => {
  res.status(201).json({ data: res.locals.results });
};

const onError: EEH = (err, _, res, next) => {
  if (typeof err === "number" && err in errors) {
    res.status(400).json({ error: { message: errors[err] } });
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
  process,
  insert,
  update,
  controllers.getMany,
  response,
  onError,
];

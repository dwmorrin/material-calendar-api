import pool from "../../utils/db";
import { withResource } from "../../utils/crud";
import { EC, EEH } from "../../utils/types";
import { getMany } from "./location.controller";

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
 * req.body = { title: string, location: string, restriction: number }[]
 */
const process: EC = (req, res, next) => {
  const { input, locations = [] } = res.locals;
  if (!res.locals.seen) res.locals.seen = {};
  // loops until input is empty
  if (!input || !input.length) return next();
  const location = input.shift();
  if (res.locals.seen[location.title]) return next("repeated title");
  res.locals.seen[location.title] = true;
  const existing = (
    locations as {
      id: number;
      title: string;
      location: string;
      restriction: number;
      allows_walk_ins: boolean;
    }[]
  ).find(({ title }) => title === location.title);
  if (existing)
    res.locals.updates.push({
      id: existing.id,
      title: location.title,
      location: location.location,
      restriction: location.restriction,
      allows_walk_ins: location.allowsWalkIns,
    });
  else
    res.locals.inserts.push({
      title: location.title,
      location: location.location,
      restriction: location.restriction,
      allows_walk_ins: location.allowsWalkIns,
    });
  process(req, res, next);
};

const insert: EC = (req, res, next) => {
  const { inserts } = res.locals;
  if (!inserts || !inserts.length) return next();
  const location = inserts.shift();
  pool.query("INSERT INTO studio SET ?", [location], (err) => {
    if (err) return next(err);
    insert(req, res, next);
  });
};

const update: EC = (req, res, next) => {
  const { updates } = res.locals;
  if (!updates || !updates.length) return next();
  const location = updates.shift();
  pool.query(
    "UPDATE studio SET ? WHERE id = ?",
    [location, location.id],
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
  if (err === "no input") {
    res.status(400).json({ error: { message: err } });
  } else if (err === "repeated title") {
    res.status(400).json({ error: { message: err } });
  } else {
    next(err);
  }
};

export default [
  setup,
  withResource("locations", "SELECT * FROM studio"),
  process,
  insert,
  update,
  getMany,
  response,
  onError,
];

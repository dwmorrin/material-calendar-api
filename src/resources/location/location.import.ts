/* eslint-disable no-console */
import { Connection } from "mysql";
import { getUnsafeMultipleStatementConnection } from "../../utils/db";
import { query, respond, withResource } from "../../utils/crud";
import { EC, EEH } from "../../utils/types";

type LocationInputRecord = {
  title: string;
  location: string;
  restriction: number;
  allowsWalkIns: boolean;
};

const setup: EC = (req, res, next) => {
  const input: LocationInputRecord[] = req.body;
  if (!input || !(Array.isArray(input) && input.length))
    return next("no input");
  res.locals.input = input;
  res.locals.inserts = [];
  res.locals.updates = [];
  res.locals.seen = {};
  next();
};

interface LocationRecord {
  id: number;
  title: string;
  location: string;
  restriction: number;
  allows_walk_ins: boolean;
}

type LocationHashTable = Record<string, true>;

const process: EC = (_, res, next) => {
  const input: LocationInputRecord[] = res.locals.input;
  const locations: LocationRecord[] = res.locals.locations; // from withResource
  const seen: LocationHashTable = res.locals.seen;
  const inserts: Omit<LocationRecord, "id">[] = res.locals.inserts;
  const updates: (Omit<LocationRecord, "id" | "title"> | number)[] =
    res.locals.updates;
  if (!input.length) return next();
  input.forEach(({ title, location, restriction, allowsWalkIns }) => {
    if (seen[title]) throw new Error("repeated title");
    seen[title] = true;
    const existing = locations.find(({ title: t }) => t === title);
    if (existing) {
      updates.push({ location, restriction, allows_walk_ins: allowsWalkIns });
      updates.push(existing.id);
    } else
      inserts.push({
        title,
        location,
        restriction,
        allows_walk_ins: allowsWalkIns,
      });
  });
  next();
};

const startTransaction: EC = (_, res, next) => {
  const unsafeConnection = getUnsafeMultipleStatementConnection();
  res.locals.connection = unsafeConnection;
  unsafeConnection.beginTransaction((err) => {
    if (err) return next(err);
    next();
  });
};

const insert: EC = (_, res, next) => {
  const connection: Connection = res.locals.connection;
  const inserts: Omit<LocationRecord, "id">[] = res.locals.inserts;
  if (!inserts.length) return next();
  connection.query(
    "INSERT INTO location SET ?;".repeat(inserts.length),
    inserts,
    (err) => {
      if (err) return next(err);
      next();
    }
  );
};

const update: EC = (_, res, next) => {
  const connection: Connection = res.locals.connection;
  const updates: (Omit<LocationRecord, "id" | "title"> | number)[] =
    res.locals.updates;
  if (!updates.length) return next();
  connection.query(
    "UPDATE location SET ? WHERE id = ?;".repeat(updates.length / 2),
    updates,
    (err) => {
      if (err) return next(err);
      next();
    }
  );
};

const commitTransaction: EC = (_, res, next) => {
  const connection: Connection = res.locals.connection;
  connection.commit((err) => {
    if (err) return next(err);
    connection.end((error) => {
      if (error) return next(error);
      delete res.locals.connection;
      next();
    });
  });
};

const rollbackGuard: EEH = (error, _, res, next) => {
  const connection: Connection = res.locals.connection;
  if (!connection) return next(error);
  console.log("error during transaction; calling rollback");
  connection.rollback(() => next(error));
};

const unsafeConnectionErrorHandler: EEH = (error, _, res, next) => {
  const connection: Connection = res.locals.connection;
  if (!connection) return next(error);
  console.log("terminating unsafe connection due to error:");
  console.log(error);
  connection.end((error2) => {
    if (error2) return next(error2);
    delete res.locals.unsafeConnection;
    next(error);
  });
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
  withResource("locations", "SELECT * FROM location"),
  process,
  startTransaction,
  insert,
  update,
  commitTransaction,
  rollbackGuard,
  unsafeConnectionErrorHandler,
  query({
    sql: "SELECT * FROM location_view",
    then: (results, _, res) => (res.locals.results = results),
  }),
  respond({
    status: 201,
    data: (_, res) => res.locals.results,
  }),
  onError,
];

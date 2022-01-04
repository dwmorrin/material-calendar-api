/**
 * Create, Read, Update, Delete (CRUD) generic handlers.
 * For use with simple CRUD operations, or as templates when writing custom
 * CRUD handlers.
 */
import { NextFunction, Request, Response } from "express";
import pool, { inflate } from "./db";
import { MysqlError } from "mysql";
import { EC } from "./types";

// for use in express routes: ID must be numeric
// (e.g. /api/users/12345, router.get(`/api/users/${numericId}`))
export const numericId = ":id(\\d+)";

export enum CrudAction {
  Create = "POST",
  Read = "GET",
  Update = "PUT",
  Delete = "DELETE",
}

export const withResource =
  (key: string, query: string): EC =>
  (_, res, next) =>
    pool.query(query, [], (error, results) => {
      if (error) return next(error);
      res.locals[key] = results.map(inflate);
      next();
    });

type ParamBuilder<T> = (req: Request, res: Response) => T | T[];

/** @throws */
export type QueryAssertion = (req: Request, res: Response) => void;

type ResultsHandler = (
  results: Record<string, unknown>[],
  req: Request,
  res: Response
) => void;

type InsertHandler = (
  results: { insertId: number },
  req: Request,
  res: Response
) => void;

interface QueryProps<T> {
  sql: string;
  using?: ParamBuilder<T>;
  then?: ResultsHandler; // handler for SELECT queries
  insertThen?: InsertHandler; // variation of 'then' for INSERT queries
  assert?: QueryAssertion;
}

const storeResults: ResultsHandler = (results, _, res) =>
  (res.locals.results = results);

export function query<T>({
  sql,
  using,
  then,
  insertThen,
  assert,
}: QueryProps<T>): EC {
  if (then && insertThen)
    throw new Error("cannot have both 'then' and 'insertThen' in a query");
  return (req, res, next) => {
    if (assert)
      try {
        assert(req, res);
      } catch (error) {
        if (error === "continue") return next();
        return next(error);
      }
    const values: T | T[] = using ? using(req, res) : [];
    pool.query(sql, values, (error, results) => {
      if (error) return next(error);
      if (then) {
        // SELECT query handler
        if (!Array.isArray(results))
          return next("query results must be an array to use 'then'");
        then(results.map(inflate), req, res);
      } else if (insertThen) {
        // INSERT query handler
        insertThen(results, req, res);
      } else {
        // no handler specified
        res.locals.results = results;
      }
      next();
    });
  };
}

const getFromResLocals = (
  keys: string[],
  res: Response
): Record<string, unknown> => {
  const data = {} as Record<string, unknown>;
  for (const key of keys) {
    if (!(key in res.locals))
      throw new Error("bad key (nothing found): " + key);
    data[key] = res.locals[key];
  }
  return data;
};

type DataHandler = (req: Request, res: Response) => unknown;

interface ResponseProps {
  callNext?: boolean;
  data: DataHandler;
  kind?: "UPDATE_ALL";
  status?: number;
}

const oneResult: DataHandler = (_, res) => res.locals.results[0];
const manyResults: DataHandler = (_, res) => res.locals.results;
const ok: DataHandler = () => "OK";
const echoBody: DataHandler = (req) => ({ ...req.body });
const echoBodyWithInsertId: DataHandler = (req, res) => ({
  ...req.body,
  id: res.locals.results.insertId,
});

export const dataHandlers = {
  echoBody,
  echoBodyWithInsertId,
  manyResults,
  ok,
  oneResult,
};

export const respond =
  ({ data, status = 200, callNext, kind }: ResponseProps): EC =>
  (req, res, next) => {
    res
      .status(status)
      .json({ data: data(req, res), context: req.query.context, kind });
    if (callNext) next();
  };

function readOne<T>(sql: string, using?: ParamBuilder<T>): EC[] {
  return [
    query({
      sql,
      using,
      then: storeResults,
    }),
    respond({
      data: oneResult,
    }),
  ];
}

function readMany<T>(sql: string, using?: ParamBuilder<T>): EC[] {
  return [
    query({
      sql,
      using,
      then: storeResults,
    }),
    respond({
      data: manyResults,
    }),
  ];
}

function deleteOne<T>(sql: string, using?: ParamBuilder<T>): EC[] {
  return [
    query({
      sql,
      using,
    }),
    respond({
      status: 200,
      data: ok,
    }),
  ];
}

// TODO rename once old updateOne is gone
function update1<T>(sql: string, using?: ParamBuilder<T>): EC[] {
  return [
    query({
      sql,
      using,
    }),
    respond({
      status: 201,
      data: echoBody,
    }),
  ];
}

// TODO rename once old createOne is gone
function create1<T>(sql: string, using?: ParamBuilder<T>): EC[] {
  return [
    query({
      sql,
      using,
    }),
    respond({
      status: 201,
      data: echoBodyWithInsertId,
    }),
  ];
}

export const crud = {
  createOne: create1,
  deleteOne,
  readMany,
  readOne,
  updateOne: update1,
};

const respondWithStatus =
  (keys: string[], status = 200, callNext = false): EC =>
  (req, res, next) => {
    res
      .status(status)
      .json({ data: getFromResLocals(keys, res), context: req.query.context });
    if (callNext) next();
  };

export const respondWith = (...keys: string[]): EC => respondWithStatus(keys);

// calls next(), unlike respondWith
export const respondAndContinueWith = (...keys: string[]): EC =>
  respondWithStatus(keys, 200, true);

interface CrudOptions {
  one?: boolean;
  many?: boolean;
  key?: string;
}

export const addResultsToResponse =
  (res: Response, next: NextFunction, options: CrudOptions = {}) =>
  (error: MysqlError | null, results: Record<string, unknown>[]): void => {
    const { one, many, key } = options;
    if (error) return next(error);
    // avoid unintentionally overwriting these options
    if (one !== undefined) res.locals.one = one;
    if (many !== undefined) res.locals.many = many;
    res.locals[key || "results"] = results;
    next();
  };

export const createOne =
  (table: string): EC =>
  (req, res, next) =>
    pool.query(
      "INSERT INTO ?? SET ?",
      [table, req.body],
      addResultsToResponse(res, next)
    );

export const getMany =
  (table: string): EC =>
  (_, res, next) =>
    pool.query("SELECT * FROM ??", [table], addResultsToResponse(res, next));

export const getOne =
  (table: string, key: string): EC =>
  (req, res, next) =>
    pool.query(
      "SELECT * FROM ?? WHERE ?? = ?",
      [table, key, req.params.id],
      addResultsToResponse(res, next, { one: true })
    );

export const removeOne =
  (table: string, key: string): EC =>
  (req, res, next) =>
    pool.query(
      "DELETE FROM ?? WHERE ?? = ?",
      [table, key, req.params.id],
      addResultsToResponse(res, next)
    );

export const updateOne =
  (table: string, key: string): EC =>
  (req, res, next) =>
    pool.query(
      "UPDATE ?? SET ? WHERE ?? = ?",
      [table, req.body, key, req.params.id],
      addResultsToResponse(res, next, { one: true })
    );

export const sendResults: EC = (req, res, next) => {
  const { one = false, many = false, results } = res.locals;
  if (!results) return next();
  const {
    method,
    query: { context },
  } = req;
  switch (method) {
    case CrudAction.Create:
      res.status(201).json({
        data: many ? "OK" : { ...req.body, id: results.insertId },
        context,
      });
      break;
    case CrudAction.Read:
      const data = results.map(inflate);
      res.status(200).json({ data: one ? data[0] : data, context });
      break;
    case CrudAction.Update:
      res.status(201).json({ data: one ? { ...req.body } : results, context });
      break;
    case CrudAction.Delete:
      res.status(200).json({ data: results.affectedRows, context });
      break;
    default:
      throw new Error("Invalid method " + method);
  }
};

export const controllers = (
  table: string,
  key: string
): Record<
  "createOne" | "getMany" | "getOne" | "removeOne" | "updateOne",
  EC
> => ({
  createOne: createOne(table),
  getMany: getMany(table),
  getOne: getOne(table, key),
  removeOne: removeOne(table, key),
  updateOne: updateOne(table, key),
});

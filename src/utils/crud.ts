/**
 * Create, Read, Update, Delete (CRUD) generic handlers.
 * For use with simple CRUD operations, or as templates when writing custom
 * CRUD handlers.
 */
import { NextFunction, Response } from "express";
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
  (key: string, query: string, vars = []): EC =>
  (_, res, next) =>
    pool.query(query, vars, (error, results) => {
      if (error) return next(error);
      res.locals[key] = results.map(inflate);
      next();
    });

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

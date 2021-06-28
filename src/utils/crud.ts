/**
 * Create, Read, Update, Delete (CRUD) generic handlers.
 * For use with simple CRUD operations, or as templates when writing custom
 * CRUD handlers.
 */
import { Request, Response } from "express";
import pool, { error500, inflate } from "./db";
import { MysqlError, Query } from "mysql";

export interface MySQLResponseHandler {
  req: Request;
  res: Response;
  dataMapFn?: (datum: Record<string, unknown>) => Record<string, unknown>;
  take?: number; // will return dataArray.slice(0, take) if defined
}

type CrudHandler = (
  error: MysqlError | null,
  data: Record<string, unknown>[] & { insertId?: number; affectedRows?: number }
) => Response;

/**
 * Handler for MySQL query result.  Takes a config object and returns
 * an object with 4 functions, one for each CRUD operation.
 * Example read: `pool.query(queryString, onResult({req, res}).read)`
 */
export const onResult = ({
  req,
  res,
  dataMapFn = (data) => data,
  take,
}: MySQLResponseHandler): { [k: string]: CrudHandler } => ({
  read: (error, data) =>
    error
      ? res.status(500).json(error500(error, req.query.context))
      : res.status(200).json({
          data: data.map(dataMapFn).slice(0, take || data.length),
          context: req.query.context,
        }),
  create: (error, data) =>
    error
      ? res.status(500).json(error500(error, req.query.context))
      : res.status(201).json({
          data: { ...req.body, id: data.insertId },
          context: req.query.context,
        }),
  delete: (error, data) =>
    error
      ? res.status(500).json(error500(error, req.query.context))
      : res.status(200).json({
          data: data.affectedRows,
          context: req.query.context,
        }),
  update: (error) =>
    error
      ? res.status(500).json(error500(error, req.query.context))
      : res.status(201).json({
          data: { ...req.body },
          context: req.query.context,
        }),
});

export const createOne =
  (table: string) =>
  (req: Request, res: Response): Query =>
    pool.query(
      "INSERT INTO ?? SET ?",
      [table, req.body],
      onResult({ req, res }).create
    );

export const getMany =
  (table: string) =>
  (req: Request, res: Response): Query =>
    pool.query(
      "SELECT * FROM ??",
      [table],
      onResult({ req, res, dataMapFn: inflate }).read
    );

export const getOne =
  (table: string, key: string) =>
  (req: Request, res: Response): Query =>
    pool.query(
      "SELECT * FROM ?? WHERE ?? = ?",
      [table, key, req.params.id],
      onResult({ req, res, dataMapFn: inflate, take: 1 }).read
    );

export const removeOne =
  (table: string, key: string) =>
  (req: Request, res: Response): Query =>
    pool.query(
      "DELETE FROM ?? WHERE ?? = ?",
      [table, key, req.params.id],
      onResult({ req, res }).delete
    );

export const updateOne =
  (table: string, key: string) =>
  (req: Request, res: Response): Query =>
    pool.query(
      "UPDATE ?? SET ? WHERE ?? = ?",
      [table, req.body, key, req.params.id],
      onResult({ req, res }).update
    );

export const controllers = (
  table: string,
  key: string
): Record<string, (req: Request, res: Response) => Query> => ({
  createOne: createOne(table),
  getMany: getMany(table),
  getOne: getOne(table, key),
  removeOne: removeOne(table, key),
  updateOne: updateOne(table, key),
});

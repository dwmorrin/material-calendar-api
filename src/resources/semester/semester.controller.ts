import { Request, Response } from "express";
import pool, { mapKeysToBool } from "../../utils/db";
import {
  controllers,
  MySQLResponseHandler,
  onResult,
  useErrorHandler,
} from "../../utils/crud";
import { MysqlError, Query, queryCallback } from "mysql";
import { getActive, getSemester } from "./semester.query";

const makeActiveBool = mapKeysToBool("active");

export const getCurrent = (req: Request, res: Response): Query =>
  pool.query(
    getActive,
    onResult({ req, res, dataMapFn: makeActiveBool, take: 1 }).read
  );

export const getMany = (req: Request, res: Response): Query =>
  pool.query(
    getSemester,
    onResult({ req, res, dataMapFn: makeActiveBool }).read
  );

const updateActive = (semesterId: number, cb: queryCallback): Query =>
  pool.query(
    "REPLACE INTO active_semester SET id = 1, semester_id = ?",
    [semesterId],
    cb
  );

export const createOne = (req: Request, res: Response): void => {
  const onError = useErrorHandler(req, res);
  pool.query(
    "INSERT INTO semester SET ?",
    [{ title: req.body.title, start: req.body.start, end: req.body.end }],
    (error, results) => {
      if (error) return onError(error);
      const { insertId } = results;
      const onSuccess = (error: MysqlError | null) =>
        error
          ? onError(error)
          : res.status(201).json({
              data: { ...req.body, id: insertId },
              context: req.query.context,
            });
      if (req.body.active) updateActive(insertId, onSuccess);
      else return onSuccess(null);
    }
  );
};

export const updateOne = (req: Request, res: Response): void => {
  const onError = useErrorHandler(req, res);
  pool.query(
    "UPDATE semester SET ? WHERE id = ?",
    [
      { title: req.body.title, start: req.body.start, end: req.body.end },
      req.params.id,
    ],
    (error) => {
      if (error) onError(error);
      if (req.body.active)
        updateActive(Number(req.params.id), onResult({ req, res }).update);
      else onResult({ req, res }).update(null, []);
    }
  );
};

export default {
  ...controllers("semester", "id"),
  createOne,
  getCurrent,
  getMany,
  updateOne,
};

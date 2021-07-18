import pool from "../../utils/db";
import {
  controllers,
  addResultsToResponse,
  CrudAction,
} from "../../utils/crud";
import { getActive, getSemester } from "./semester.query";
import { EC } from "../../utils/types";

export const getCurrent: EC = (req, res, next) =>
  pool.query(getActive, addResultsToResponse(res, next, { one: true }));

export const getMany: EC = (req, res, next) =>
  pool.query(getSemester, addResultsToResponse(res, next));

const updateActive: EC = (req, res, next) => {
  if (req.body.active) {
    const id =
      req.method === CrudAction.Create
        ? res.locals.results.insertId
        : req.params.id;
    pool.query(
      "REPLACE INTO active_semester SET id = 1, semester_id = ?",
      [id],
      addResultsToResponse(res, next, { key: "ignore" })
    );
  } else {
    next();
  }
};

export const createOne: EC = (req, res, next) =>
  pool.query(
    "INSERT INTO semester SET ?",
    [{ title: req.body.title, start: req.body.start, end: req.body.end }],
    addResultsToResponse(res, next)
  );

export const updateOne: EC = (req, res, next): void => {
  pool.query(
    "UPDATE semester SET ? WHERE id = ?",
    [
      { title: req.body.title, start: req.body.start, end: req.body.end },
      req.params.id,
    ],
    addResultsToResponse(res, next)
  );
};

export default {
  ...controllers("semester", "id"),
  createOne: [createOne, updateActive],
  getCurrent,
  getMany,
  updateOne: [updateOne, updateActive],
};

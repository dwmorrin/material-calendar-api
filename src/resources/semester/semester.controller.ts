import pool from "../../utils/db";
import {
  controllers,
  addResultsToResponse,
  CrudAction,
} from "../../utils/crud";
import { EC } from "../../utils/types";

const getCurrent: EC = (_, res, next) =>
  pool.query(
    "SELECT * FROM active_semester_view",
    addResultsToResponse(res, next, { one: true })
  );

const getMany: EC = (_, res, next) =>
  pool.query("SELECT * FROM semester_view", addResultsToResponse(res, next));

const updateActive: EC = (req, res, next) => {
  if (req.body.active) {
    const id =
      req.method === CrudAction.Create
        ? res.locals.results.insertId
        : req.params.id;
    pool.query(
      "REPLACE INTO active_semester SET id = 1, semester_id = ?",
      [id],
      addResultsToResponse(res, next, { key: "ignore", one: true })
    );
  } else {
    next();
  }
};

const createOne: EC = (req, res, next) =>
  pool.query(
    "INSERT INTO semester SET ?",
    [{ title: req.body.title, start: req.body.start, end: req.body.end }],
    addResultsToResponse(res, next)
  );

const updateOne: EC = (req, res, next): void => {
  pool.query(
    "UPDATE semester SET ? WHERE id = ?",
    [
      { title: req.body.title, start: req.body.start, end: req.body.end },
      req.params.id,
    ],
    addResultsToResponse(res, next, { one: true })
  );
};

export default {
  ...controllers("semester", "id"),
  createOne: [createOne, updateActive],
  getCurrent,
  getMany,
  updateOne: [updateOne, updateActive],
};

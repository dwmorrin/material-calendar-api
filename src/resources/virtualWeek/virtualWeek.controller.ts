import pool from "../../utils/db";
import {
  addResultsToResponse,
  respondWith,
  withResource,
} from "../../utils/crud";
import { EC } from "../../utils/types";

const getOne: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM virtual_week_view WHERE id = ?",
    req.params.id,
    addResultsToResponse(res, next, { one: true })
  );

export const getMany: EC = (_, res, next) =>
  pool.query(
    "SELECT * FROM virtual_week_view",
    addResultsToResponse(res, next)
  );

export const createOne: EC = (req, res, next) =>
  pool.query(
    `INSERT INTO virtual_week SET ?`,
    [
      {
        start: req.body.start,
        end: req.body.end,
        studio_id: req.body.locationId,
        semester_id: req.body.semesterId,
      },
    ],
    addResultsToResponse(res, next)
  );

const updateOne: EC = (req, res, next) =>
  pool.query(
    `UPDATE virtual_week SET ? WHERE id = ?`,
    [{ start: req.body.start, end: req.body.end }, req.body.id],
    addResultsToResponse(res, next, { one: true })
  );

const splitOneUpdate: EC = (req, _, next) => {
  // resize the first virtual week in the body; create the second virtual week
  const [resizedWeek, newWeek] = req.body;
  if (!resizedWeek || !newWeek)
    return next(new Error("missing new virtual weeks in request body"));
  pool.query(
    `UPDATE virtual_week SET ? WHERE id = ?`,
    [{ start: resizedWeek.start, end: resizedWeek.end }, resizedWeek.id],
    (error) => {
      if (error) return next(error);
      next();
    }
  );
};

const splitOneInsert: EC = (req, res, next) => {
  const [, newWeek] = req.body;
  pool.query(
    `INSERT INTO virtual_week SET ?`,
    [
      {
        start: newWeek.start,
        end: newWeek.end,
        studio_id: newWeek.locationId,
        semester_id: newWeek.semesterId,
      },
    ],
    addResultsToResponse(res, next)
  );
};

export const joinTwo: EC = (req, res, next) => {
  const [joined, toDelete] = req.body;
  if (!joined || !toDelete)
    return res.status(400).json({
      error: { message: "missing new virtual weeks in request body" },
    });
  pool.query(
    `UPDATE virtual_week SET ? WHERE id = ?`,
    [{ start: joined.start, end: joined.end }, joined.id],
    (error) => {
      if (error) next(error);
      pool.query(
        `DELETE FROM virtual_week WHERE id = ?`,
        [toDelete.id],
        addResultsToResponse(res, next)
      );
    }
  );
};

const removeOne: EC = (req, res, next) => {
  pool.query(
    `DELETE FROM virtual_week WHERE id = ?`,
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );
};

const withUpdatedProjectsAndWeeks = [
  withResource("projects", "SELECT * FROM project_view"),
  withResource("weeks", "SELECT * FROM virtual_week_view"),
  respondWith("projects", "weeks"),
];

export default {
  createOne: [createOne, ...withUpdatedProjectsAndWeeks],
  getMany,
  getOne,
  joinTwo: [joinTwo, ...withUpdatedProjectsAndWeeks],
  removeOne: [removeOne, ...withUpdatedProjectsAndWeeks],
  splitOne: [splitOneUpdate, splitOneInsert, ...withUpdatedProjectsAndWeeks],
  updateOne: [updateOne, ...withUpdatedProjectsAndWeeks],
};

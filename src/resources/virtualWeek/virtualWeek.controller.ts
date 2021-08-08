import pool, { inflate } from "../../utils/db";
import {
  addResultsToResponse,
  controllers,
  CrudAction,
} from "../../utils/crud";
import { EC } from "../../utils/types";

const getOneQuery = `
SELECT
  id,
  start,
  end,
  studio_id AS locationId,
  semester_id AS semesterId
FROM
  virtual_week
`;

export const getOne: EC = (_, res, next) =>
  pool.query(getOneQuery, addResultsToResponse(res, next, { one: true }));

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

// TODO this should be withResource
const withUpdatedProjects: EC = (_, res, next) =>
  pool.query("SELECT * FROM project_view", (error, projects) => {
    if (error) return next(error);
    res.locals.projects = projects.map(inflate);
    next();
  });

// TODO this should be withResource
const withUpdatedWeeks: EC = (_, res, next) =>
  pool.query("SELECT * FROM virtual_week_view", (error, weeks) => {
    if (error) return next(error);
    res.locals.weeks = weeks.map(inflate);
    next();
  });

const sendWithUpdatedProjectsAndWeeks: EC = (req, res, next) => {
  const { projects, weeks } = res.locals;
  const { results } = res.locals;
  if (!results) return next("no results in virtual week responder");
  const {
    method,
    query: { context },
  } = req;
  switch (method) {
    case CrudAction.Create:
    case CrudAction.Update:
    case CrudAction.Delete:
      res.status(201).json({
        data: {
          weeks,
          projects,
        },
        context,
      });
      break;
    default:
      throw new Error("Invalid method " + method);
  }
};

export default {
  ...controllers("virtual_week", "id"),
  createOne: [
    createOne,
    withUpdatedProjects,
    withUpdatedWeeks,
    sendWithUpdatedProjectsAndWeeks,
  ],
  getMany,
  getOne,
  joinTwo: [
    joinTwo,
    withUpdatedProjects,
    withUpdatedWeeks,
    sendWithUpdatedProjectsAndWeeks,
  ],
  splitOne: [
    splitOneUpdate,
    splitOneInsert,
    withUpdatedProjects,
    withUpdatedWeeks,
    sendWithUpdatedProjectsAndWeeks,
  ],
  updateOne: [
    updateOne,
    withUpdatedProjects,
    withUpdatedWeeks,
    sendWithUpdatedProjectsAndWeeks,
  ],
};

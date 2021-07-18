import pool from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import { userCourseQuery, userProjectQuery, userQueryFn } from "./user.query";
import { EC } from "../../utils/types";

export const getCourses: EC = (req, res, next) =>
  pool.query(
    userCourseQuery(req.params.id),
    [req.params.id],
    addResultsToResponse(res, next)
  );

export const getProjects: EC = (req, res, next) =>
  pool.query(
    userProjectQuery(req.params.id),
    [req.params.id],
    addResultsToResponse(res, next)
  );

export const getOne: EC = (req, res, next) =>
  pool.query(
    userQueryFn("WHERE u.id = ?"),
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

export const getMany: EC = (_, res, next) =>
  pool.query(userQueryFn(), addResultsToResponse(res, next));

export const createOne: EC = (req, res, next) =>
  pool.query(
    "INSERT INTO user SET ?",
    [{ ...req.body }],
    addResultsToResponse(res, next)
  );

export const updateOne: EC = (req, res, next) =>
  pool.query(
    "UPDATE user SET ? WHERE id = ?",
    [
      {
        ...req.body,
      },
      req.params.id,
    ],
    addResultsToResponse(res, next)
  );

export const removeOne: EC = (req, res, next) =>
  pool.query(
    "DELETE FROM user WHERE id = ?",
    req.params.id,
    addResultsToResponse(res, next)
  );

export default {
  createOne,
  getOne,
  updateOne,
  removeOne,
  getMany,
  getCourses,
  getProjects,
};

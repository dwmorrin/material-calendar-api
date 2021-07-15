import { Request, Response } from "express";
import pool, { inflate } from "../../utils/db";
import { onResult } from "../../utils/crud";
import { userCourseQuery, userProjectQuery, userQueryFn } from "./user.query";
import { Query } from "mysql";

export const getCourses = (req: Request, res: Response): Query =>
  pool.query(
    userCourseQuery(req.params.id),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const getProjects = (req: Request, res: Response): Query =>
  pool.query(
    userProjectQuery(req.params.id),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const getOne = (req: Request, res: Response): Query =>
  pool.query(
    userQueryFn("WHERE u.id = ?"),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );

export const getMany = (req: Request, res: Response): Query =>
  pool.query(userQueryFn(), onResult({ req, res, dataMapFn: inflate }).read);

export const createOne = (req: Request, res: Response): Query =>
  pool.query(
    "INSERT INTO user SET ?",
    [{ ...req.body }],
    onResult({ req, res }).create
  );

export const updateOne = (req: Request, res: Response): Query =>
  pool.query(
    "UPDATE user SET ? WHERE id = ?",
    [
      {
        ...req.body,
      },
      req.params.id,
    ],
    onResult({ req, res }).update
  );

export const removeOne = (req: Request, res: Response): Query =>
  pool.query(
    "DELETE FROM user WHERE id = ?",
    req.params.id,
    onResult({ req, res }).delete
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

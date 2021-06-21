import { Request, Response } from "express";
import pool, { inflate } from "../../utils/db";
import { onResult } from "../../utils/crud";
import {
  groupQueryFn,
  userCourseQuery,
  userProjectQuery,
  userQueryFn,
} from "./user.query";
import adapter from "./user.adapter";

export const joinGroup = (req: Request, res: Response) =>
  pool.query(
    "INSERT INTO student_group SET student_id=?, group_id=?",
    [req.params.id, req.params.groupId],
    onResult({ req, res }).create
  );

export const leaveGroup = (req: Request, res: Response) =>
  pool.query(
    "DELETE FROM student_group WHERE student_id=? AND group_id=?",
    [req.params.id, req.params.groupId],
    onResult({ req, res }).delete
  );

export const getGroups = (req: Request, res: Response) =>
  pool.query(groupQueryFn(), onResult({ req, res, dataMapFn: inflate }).read);

export const getGroupsForOne = (req: Request, res: Response) =>
  pool.query(
    groupQueryFn("WHERE JSON_SEARCH(g.members, 'all', ?)"),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const getOneGroup = (req: Request, res: Response) =>
  pool.query(
    groupQueryFn("WHERE g.id = ?"),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );

export const getCourses = (req: Request, res: Response) =>
  pool.query(
    userCourseQuery(req.params.id),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const getProjects = (req: Request, res: Response) =>
  pool.query(
    userProjectQuery(req.params.id),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const getOne = (req: Request, res: Response) => {
  pool.query(
    userQueryFn("WHERE u.user_id = ?"),
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );
};

export const getMany = (req: Request, res: Response) =>
  pool.query(userQueryFn(), onResult({ req, res, dataMapFn: inflate }).read);

export const createOne = (req: Request, res: Response) =>
  pool.query(
    "INSERT INTO user SET ?",
    adapter(req.body),
    onResult({ req, res }).create
  );

export const updateOne = (req: Request, res: Response) =>
  pool.query(
    "UPDATE user SET ? WHERE id = ?",
    [adapter(req.body), req.params.id],
    onResult({ req, res }).update
  );

export const removeOne = (req: Request, res: Response) =>
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
  getGroups,
  getGroupsForOne,
  getOneGroup,
  getProjects,
  joinGroup,
  leaveGroup,
};

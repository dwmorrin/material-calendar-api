import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";
import { controllers } from "../../utils/crud";
import {
  groupQueryFn,
  userCourseQuery,
  userProjectQuery,
  userQueryFn,
} from "./user.query";

export const getGroups = (req: Request, res: Response) => {
  pool.query(groupQueryFn(), (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: rows.map(inflate), context: req.query.context });
  });
};

export const getGroupsForOne = (req: Request, res: Response) => {
  pool.query(
    groupQueryFn("WHERE JSON_SEARCH(g.members, 'all', ?)"),
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res
        .status(200)
        .json({ data: rows.map(inflate), context: req.query.context });
    }
  );
};

export const getOneGroup = (req: Request, res: Response) => {
  pool.query(groupQueryFn("WHERE g.id = ?"), [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: inflate(rows[0]), context: req.query.context });
  });
};

export const getCourses = (req: Request, res: Response) =>
  pool.query(userCourseQuery, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: rows.map(inflate), context: req.query.context });
  });

export const getProjects = (req: Request, res: Response) =>
  pool.query(userProjectQuery, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: rows.map(inflate), context: req.query.context });
  });

export const getOne = (req: Request, res: Response) => {
  pool.query(
    userQueryFn("WHERE u.user_id = ?"),
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res
        .status(200)
        .json({ data: inflate(rows[0]), context: req.query.context });
    }
  );
};

export const getMany = (req: Request, res: Response) => {
  pool.query(userQueryFn(), (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res.status(200).json({ data: inflate(rows), context: req.query.context });
  });
};

export default {
  ...controllers("user", "user_id"),
  getOne,
  getMany,
  getCourses,
  getGroups,
  getGroupsForOne,
  getOneGroup,
  getProjects,
};

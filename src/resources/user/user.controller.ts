import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";
import { controllers } from "../../utils/crud";
import {
  groupQueryFn,
  userCourseQuery,
  userProjectQuery,
  userQueryFn,
} from "./user.query";
import adapter from "./user.adapter";

export const getGroups = (req: Request, res: Response) => {
  pool.query(groupQueryFn(), (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows.map(inflate), context });
  });
};

export const getGroupsForOne = (req: Request, res: Response) => {
  pool.query(
    groupQueryFn("WHERE JSON_SEARCH(g.members, 'all', ?)"),
    [req.params.id],
    (err, rows) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: rows.map(inflate), context });
    }
  );
};

export const getOneGroup = (req: Request, res: Response) => {
  pool.query(groupQueryFn("WHERE g.id = ?"), [req.params.id], (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: inflate(rows[0]), context });
  });
};

export const getCourses = (req: Request, res: Response) =>
  pool.query(userCourseQuery(req.params.id), [req.params.id], (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows.map(inflate), context });
  });

export const getProjects = (req: Request, res: Response) =>
  pool.query(userProjectQuery(req.params.id), [req.params.id], (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows.map(inflate), context });
  });

export const getOne = (req: Request, res: Response) => {
  pool.query(
    userQueryFn("WHERE u.user_id = ?"),
    [req.params.id],
    (err, rows) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: inflate(rows[0]), context });
    }
  );
};

export const getMany = (req: Request, res: Response) => {
  pool.query(userQueryFn(), (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows.map(inflate), context });
  });
};

export const createOne = (req: Request, res: Response) => {
  pool.query("INSERT INTO user SET ?", adapter(req.body), (err, results) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(201).json({
      data: { ...req.body, id: results.insertId },
      context,
    });
  });
};

export const updateOne = (req: Request, res: Response) => {
  pool.query(
    "UPDATE user SET ? WHERE id = ?",
    [adapter(req.body), req.params.id],
    (err) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: req.body, context });
    }
  );
};

export const removeOne = (req: Request, res: Response) => {
  pool.query("DELETE FROM user WHERE id = ?", req.params.id, (err, results) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: results.affectedRows, context });
  });
};

export default {
  ...controllers("user", "user_id"),
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
};

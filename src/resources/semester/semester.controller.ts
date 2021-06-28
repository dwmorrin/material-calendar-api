import { Request, Response } from "express";
import pool from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";
import { omit } from "ramda";
import { Query } from "mysql";
import { getActive, getSemester } from "./semester.query";

export const getCurrent = (req: Request, res: Response): Query =>
  pool.query(getActive, onResult({ req, res, take: 1 }).read);

export const getMany = (req: Request, res: Response): Query =>
  pool.query(getSemester, onResult({ req, res }).read);

/**
 * temporary adapter to matchup new column names to old
 */
const adapter = (semester: { title: string }): { name: string } => ({
  ...semester,
  name: semester.title,
});

export const createOne = (req: Request, res: Response): Query =>
  pool.query(
    "INSERT INTO semester SET ?",
    [omit(["id", "title"], adapter(req.body))],
    onResult({ req, res }).create
  );

export const updateOne = (req: Request, res: Response): Query =>
  pool.query(
    "UPDATE semester SET ? WHERE id = ?",
    [omit(["title"], adapter(req.body)), req.params.id],
    onResult({ req, res }).update
  );

export default {
  ...controllers("semester", "id"),
  createOne,
  getCurrent,
  getMany,
  updateOne,
};

import { Request, Response } from "express";
import pool from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";
import { omit } from "ramda";

const query = `
  SELECT
    id,
    name AS title,
    start,
    end
  FROM
    semester
`;

export const getCurrent = (req: Request, res: Response) =>
  pool.query(
    query + " WHERE id = (SELECT semester_id FROM active_semester)",
    onResult({ req, res, take: 1 }).read
  );

export const getMany = (req: Request, res: Response) =>
  pool.query(query, onResult({ req, res }).read);

/**
 * temporary adapter to matchup new column names to old
 */
const adapter = (semester: { title: string }): { name: string } => ({
  ...semester,
  name: semester.title,
});

export const createOne = (req: Request, res: Response) =>
  pool.query(
    "INSERT INTO semester SET ?",
    [omit(["id", "title"], adapter(req.body))],
    onResult({ req, res }).create
  );

export const updateOne = (req: Request, res: Response) => {
  console.log(req.body);
  pool.query(
    "UPDATE semester SET ? WHERE id = ?",
    [omit(["title"], adapter(req.body)), req.params.id],
    onResult({ req, res }).update
  );
};

export default {
  ...controllers("semester", "id"),
  createOne,
  getCurrent,
  getMany,
  updateOne,
};

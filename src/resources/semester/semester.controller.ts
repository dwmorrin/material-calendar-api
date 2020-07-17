import { Request, Response } from "express";
import pool, { mapKeysToBool } from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";

const makeActiveBoolean = mapKeysToBool("active");

const query = `
  SELECT
    id,
    name AS title,
    start,
    end,
    active
  FROM
    semester
`;

export const getCurrent = (req: Request, res: Response) =>
  pool.query(
    query + " WHERE id = (SELECT MAX(id) FROM semester)",
    onResult({ req, res, dataMapFn: makeActiveBoolean, take: 1 }).read
  );

export const getMany = (req: Request, res: Response) =>
  pool.query(query, onResult({ req, res, dataMapFn: makeActiveBoolean }).read);

const adapter = (semester: { id: number; title: string }): {} => {
  const copy = { ...semester };
  delete copy.id;
  delete copy.title;
  return copy;
};

export const createOne = (req: Request, res: Response) =>
  pool.query(
    "INSERT INTO semester SET ?",
    [adapter(req.body)],
    onResult({ req, res }).create
  );

export default {
  ...controllers("semester", "id"),
  createOne,
  getCurrent,
  getMany,
};

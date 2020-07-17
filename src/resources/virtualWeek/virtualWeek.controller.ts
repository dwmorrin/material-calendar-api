import { Request, Response } from "express";
import pool from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";

const getOneQuery = `
SELECT
  id,
  start,
  end,
  studio_id AS locationId
FROM
  virtual_week
`;

const getManyQuery = `
SELECT
  id,
  start,
  end,
  studio_id AS locationId,
  -1 AS 'locationHours',
  -1 AS 'projectHours'
FROM
  virtual_week
`;

export const getOne = (req: Request, res: Response) => {
  pool.query(getOneQuery, onResult({ req, res, take: 1 }).read);
};

export const getMany = (req: Request, res: Response) =>
  pool.query(getManyQuery, onResult({ req, res }).read);

export default {
  ...controllers("virtual_week", "id"),
  getMany,
  getOne,
};

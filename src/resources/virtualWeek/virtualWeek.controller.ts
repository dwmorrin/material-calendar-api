import { Request, Response } from "express";
import pool from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";
import { Query } from "mysql";

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

export const getOne = (req: Request, res: Response): Query =>
  pool.query(getOneQuery, onResult({ req, res, take: 1 }).read);

export const getMany = (req: Request, res: Response): Query =>
  pool.query(getManyQuery, onResult({ req, res }).read);

export const createOne = (req: Request, res: Response): Query =>
  pool.query(
    `INSERT INTO virtual_week SET ?`,
    [
      {
        start: req.body.start,
        end: req.body.end,
        studio_id: req.body.locationId,
        semester: req.body.semesterId,
      },
    ],
    onResult({ req, res }).create
  );

export default {
  ...controllers("virtual_week", "id"),
  createOne,
  getMany,
  getOne,
};

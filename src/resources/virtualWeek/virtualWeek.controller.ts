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
  vw.id,
  vw.start,
  vw.end,
  vw.studio_id AS locationId,
  IFNULL(
    (
      SELECT SUM(sh.hours)
      FROM studio_hours sh
      WHERE vw.studio_id = sh.studio_id
      AND sh.date BETWEEN vw.start and vw.end
    ),
    0
  ) AS 'locationHours',
  IFNULL(
    (
      SELECT SUM(pa.hours)
      FROM project_allotment pa
      WHERE vw.studio_id = pa.studio_id
      AND pa.start >= vw.start
      AND pa.end <= vw.end
    ),
    0
  ) AS 'projectHours'
FROM
  virtual_week vw
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

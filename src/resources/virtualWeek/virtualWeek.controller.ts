import { Request, Response } from "express";
import pool, { error500 } from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";
import { Query } from "mysql";

const getOneQuery = `
SELECT
  id,
  start,
  end,
  studio_id AS locationId,
  semester_id AS semesterId
FROM
  virtual_week
`;

const getManyQuery = `
SELECT
  vw.id,
  vw.start,
  vw.end,
  vw.studio_id AS locationId,
  vw.semester_id AS semesterId,
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
      FROM project_virtual_week_hours pa
      WHERE pa.virtual_week_id = vw.id
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
        semester_id: req.body.semesterId,
      },
    ],
    onResult({ req, res }).create
  );

export const updateOne = (req: Request, res: Response): Query =>
  pool.query(
    `UPDATE virtual_week SET ? WHERE id = ?`,
    [{ start: req.body.start, end: req.body.end }, req.body.id],
    onResult({ req, res }).update
  );

export const splitOne = (req: Request, res: Response): Response | undefined => {
  // resize the first virtual week in the body; create the second virtual week
  const [resizedWeek, newWeek] = req.body;
  if (!resizedWeek || !newWeek)
    return res.status(400).json({
      error: { message: "missing new virtual weeks in request body" },
    });
  pool.query(
    `UPDATE virtual_week SET ? WHERE id = ?`,
    [{ start: resizedWeek.start, end: resizedWeek.end }, resizedWeek.id],
    (error) => {
      if (error)
        return res.status(500).json(error500(error, req.query.context));
      pool.query(
        `INSERT INTO virtual_week SET ?`,
        [
          {
            start: newWeek.start,
            end: newWeek.end,
            studio_id: newWeek.locationId,
            semester_id: newWeek.semesterId,
          },
        ],
        onResult({ req, res }).create
      );
    }
  );
};

export default {
  ...controllers("virtual_week", "id"),
  createOne,
  getMany,
  getOne,
  splitOne,
  updateOne,
};

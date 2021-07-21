import { addResultsToResponse, controllers } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

/**
 * Reading: use the `event` view.
 * Writing: use the `allotment` table.
 */

const getMany: EC = (_, res, next) =>
  pool.query("SELECT * FROM event", addResultsToResponse(res, next));

const getOne: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM event WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

const createMany: EC = (req, res, next) =>
  pool.query(
    `REPLACE INTO allotment (
      start, end, studio_id, bookable, description
    ) VALUES ?`,
    [
      req.body.map(
        ({
          start = "",
          end = "",
          locationId = 0,
          reservable = false,
          title = "",
        }) => [start, end, locationId, reservable, title]
      ),
    ],
    addResultsToResponse(res, next, { many: true })
  );

const updateOne: EC = (req, res, next) =>
  pool.query(
    `UPDATE allotment SET ? WHERE id = ?`,
    [
      {
        start: req.body.start,
        end: req.body.end,
        studio_id: req.body.locationId,
        bookable: req.body.reservable,
        description: req.body.title,
      },
      req.params.id,
    ],
    addResultsToResponse(res, next)
  );

const range: EC = (req, res, next) => {
  const { start, end } = req.body;
  pool.query(
    "SELECT * FROM event WHERE a.start BETWEEN ? AND ?",
    [start, end],
    (err, results) => {
      if (err) return next(err);
      res.status(200).json({ data: results });
    }
  );
};

export default {
  ...controllers("allotment", "id"),
  createMany,
  getMany,
  getOne,
  updateOne,
  range,
};

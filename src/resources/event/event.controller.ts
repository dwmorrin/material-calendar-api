import { addResultsToResponse, controllers } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

/**
 * Reading: use the `event_view` view.
 * Writing: use the `event` table.
 */

const getMany: EC = (_, res, next) =>
  pool.query("SELECT * FROM event_view", addResultsToResponse(res, next));

const getOne: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM event_view WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

const createMany: EC = (req, res, next) =>
  pool.query(
    `REPLACE INTO event (
      start, end, location_id, bookable, description
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
    `UPDATE event SET ? WHERE id = ?`,
    [
      {
        start: req.body.start,
        end: req.body.end,
        location_id: req.body.locationId,
        bookable: req.body.reservable,
        description: req.body.title,
      },
      req.params.id,
    ],
    addResultsToResponse(res, next, { one: true })
  );

const range: EC = (req, res, next) => {
  const { start, end } = req.body;
  pool.query(
    "SELECT * FROM event_view WHERE a.start BETWEEN ? AND ?",
    [start, end],
    (err, results) => {
      if (err) return next(err);
      res.status(200).json({ data: results });
    }
  );
};

export default {
  ...controllers("event", "id"),
  createMany,
  getMany,
  getOne,
  updateOne,
  range,
};

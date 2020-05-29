import { Request, Response } from "express";
import pool, { error500 } from "../../utils/db";
import { controllers } from "../../utils/crud";

export const getGroups = (req: Request, res: Response) => {
  pool.query("SELECT * FROM course", (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res.status(200).json({ data: rows, context: req.query.context });
  });
};

export const getOneLocationAllotment = (req: Request, res: Response) => {
  pool.query(
    `
      SELECT
        *
      FROM
        project_location_allotment
      WHERE
        projectId = ?
     `,
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res.status(200).json({ data: rows[0], context: req.query.context });
    }
  );
};

export default {
  ...controllers("project_info", "id"),
  getGroups,
  getOneLocationAllotment,
};

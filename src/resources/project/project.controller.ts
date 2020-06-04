import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";
import { controllers } from "../../utils/crud";

const groupQuery = `
  SELECT
    id,
    original_course_name as title,
    JSON_ARRAY(instructor) as managers
  FROM
    course
`;

export const getGroups = (req: Request, res: Response) => {
  pool.query(groupQuery, (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: rows.map(inflate), context: req.query.context });
  });
};

export const getOneGroup = (req: Request, res: Response) => {
  pool.query(groupQuery + "WHERE id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: inflate(rows[0]), context: req.query.context });
  });
};

export const getOneLocationAllotment = (req: Request, res: Response) => {
  pool.query(
    `
      SELECT
        *
      FROM
        project_allotment
      WHERE
        project_id = ?
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
  getOneGroup,
  getOneLocationAllotment,
};

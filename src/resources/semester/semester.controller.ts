import { Request, Response } from "express";
import pool, { error500, mapKeysToBool } from "../../utils/db";

const makeActiveBoolean = mapKeysToBool("active");

export const getCurrent = (req: Request, res: Response) =>
  pool.query(
    "SELECT * FROM semester WHERE id = (SELECT MAX(id) FROM semester)",
    (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res
        .status(200)
        .json({ data: makeActiveBoolean(rows[0]), context: req.query.context });
    }
  );

export default { getCurrent };

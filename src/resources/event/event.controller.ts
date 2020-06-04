import { controllers } from "../../utils/crud";
import { Request, Response } from "express";
import pool, { error500, mapKeysToBool } from "../../utils/db";

const query = `
  SELECT 
    id,
    start,
    end,
    studio AS location,
    description AS title,
    open as reservable
  FROM
    full_calendar
`;

const getMany = (req: Request, res: Response) =>
  pool.query(query, (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    const data = rows.map((event: {}) => mapKeysToBool(event, "reservable"));
    res.status(200).json({ data, context: req.query.context });
  });

const getOne = (req: Request, res: Response) =>
  pool.query(query + "WHERE id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({
        data: mapKeysToBool(rows[0], "reservable"),
        context: req.query.context,
      });
  });

export default { ...controllers("allotment", "id"), getMany, getOne };

import { Request, Response } from "express";
import { controllers } from "../../utils/crud";
import pool, { error500 } from "../../utils/db";

const query = `
  SELECT
    id,
    name as title,
    location as groupId
  FROM
    studio
`;

export const getMany = (req: Request, res: Response) =>
  pool.query(query, (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res.status(200).json({ data: rows, context: req.query.context });
  });

export const getOne = (req: Request, res: Response) =>
  pool.query(query + "WHERE id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res.status(200).json({ data: rows[0], context: req.query.context });
  });

export default { ...controllers("studio", "id"), getMany, getOne };

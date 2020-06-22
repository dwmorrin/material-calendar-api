import { controllers } from "../../utils/crud";
import { Request, Response } from "express";
import pool, { error500 } from "../../utils/db";

const query = `
  SELECT
    id,
    title,
    parent_id AS parentId
  FROM
    category
`;

export const getMany = (req: Request, res: Response) =>
  pool.query(query, (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res.status(200).json({ data: rows, context: req.query.context });
  });

export default { ...controllers("category", "id"), getMany };

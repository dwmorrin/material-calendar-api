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
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows, context });
  });

export default { ...controllers("category", "id"), getMany };

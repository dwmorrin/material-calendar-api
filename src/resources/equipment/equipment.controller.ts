import { Request, Response } from "express";
import { controllers } from "../../utils/crud";
import pool, { error500, inflate } from "../../utils/db";

export const getTags = (req: Request, res: Response) => {
  console.warn("TODO: tags not implemented");
  res.status(200).json({ data: [], context: req.query.context });
};

export const getCategories = (req: Request, res: Response) => {
  console.warn("TODO: categories not implemented");
  res.status(200).json({ data: [], context: req.query.context });
};

export const equipmentQueryFn = (where = "") => `
  SELECT
    model AS description,
    serial as sku,
    quantity
  FROM
    equipment
  ${where}
`;

export const getOne = (req: Request, res: Response) => {
  pool.query(equipmentQueryFn("WHERE id = ?"), [req.params.id], (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: inflate(rows[0]), context: req.query.context });
  });
};

export const getMany = (req: Request, res: Response) => {
  pool.query(equipmentQueryFn(), (err, rows) => {
    if (err) return res.status(500).json(error500(err));
    res
      .status(200)
      .json({ data: rows.map(inflate), context: req.query.context });
  });
};

export default {
  ...controllers("equipment", "id"),
  getMany,
  getOne,
  getCategories,
  getTags,
};

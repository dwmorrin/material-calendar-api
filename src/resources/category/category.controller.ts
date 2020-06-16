import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";
import { controllers } from "../../utils/crud";

const query = 'SELECT category FROM equipment_info group by equipment_info.category';

export const getAll = (req: Request, res: Response) => {
    pool.query(query, (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res
        .status(200)
        .json({ data: rows.map(inflate), context: req.query.context });
    });
  };


export default {...controllers("equipment_category", "id"), getAll};

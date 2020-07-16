import { Request, Response } from "express";
import { controllers } from "../../utils/crud";
import pool, { error500, inflate } from "../../utils/db";

const query = "SELECT * FROM equipment_info";

export const getByCategory = (req: Request, res: Response) => {
  pool.query(
    query + " WHERE JSON_SEARCH(equipment_info.category, 'one', ?) group by id",
    [req.params.id],
    (err, rows) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(200).json({ data: rows.map(inflate), context });
    }
  );
};

export default { ...controllers("equipment_info", "id"), getByCategory };

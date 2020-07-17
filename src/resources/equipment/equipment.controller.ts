import { Request, Response } from "express";
import { controllers, onResult } from "../../utils/crud";
import pool, { inflate } from "../../utils/db";

const query = "SELECT * FROM equipment_info";

export const getByCategory = (req: Request, res: Response) => {
  pool.query(
    query + " WHERE JSON_SEARCH(equipment_info.category, 'one', ?) group by id",
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate }).read
  );
};

export default { ...controllers("equipment_info", "id"), getByCategory };

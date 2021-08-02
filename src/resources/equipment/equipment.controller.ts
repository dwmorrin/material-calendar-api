import { controllers, addResultsToResponse } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

const query = `
  SELECT
    *
  FROM equipment_view
  WHERE
    JSON_SEARCH(category, 'one', ?)
  GROUP BY id
`;

export const getByCategory: EC = (req, res, next) =>
  pool.query(query, [req.params.id], addResultsToResponse(res, next));

export default { ...controllers("equipment_view", "id"), getByCategory };

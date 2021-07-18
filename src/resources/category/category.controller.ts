import { controllers, addResultsToResponse } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

const query = `
  SELECT
    id,
    title,
    parent_id AS parentId
  FROM
    category
`;

export const getMany: EC = (_, res, next) =>
  pool.query(query, addResultsToResponse(res, next));

export default { ...controllers("category", "id"), getMany };

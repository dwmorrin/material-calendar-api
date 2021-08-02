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

const updateOne: EC = (req, res, next) => {
  const { id } = req.params;
  const { title, parentId } = req.body;
  pool.query(
    "UPDATE category SET ? WHERE id = ?",
    [{ title, parent_id: parentId }, id],
    addResultsToResponse(res, next, { one: true })
  );
};

export default { ...controllers("category", "id"), getMany, updateOne };

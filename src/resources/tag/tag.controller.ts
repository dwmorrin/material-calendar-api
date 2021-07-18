import pool from "../../utils/db";
import { controllers, addResultsToResponse } from "../../utils/crud";
import { EC } from "../../utils/types";

const query = `
  SELECT
    tag.id,
    tag.title AS title, 
    JSON_OBJECT(
      'id', c.id,
      'title', c.title,
      'parentId', c.parent_id
    ) as 'category'
  FROM tag
  LEFT JOIN category c ON tag.category = c.id
`;

export const getMany: EC = (_, res, next) =>
  pool.query(query, addResultsToResponse(res, next));

export const getByCategory: EC = (req, res, next) =>
  pool.query(
    query + "WHERE category.category = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

export const getBySubCategory: EC = (req, res, next) =>
  pool.query(
    query + "WHERE category.sub_category = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

export default {
  ...controllers("tag", "id"),
  getMany,
  getByCategory,
  getBySubCategory,
};

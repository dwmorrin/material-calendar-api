import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";

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

export const getMany = (req: Request, res: Response) =>
  pool.query(query, onResult({ req, res, dataMapFn: inflate }).read);

export const getByCategory = (req: Request, res: Response) => {
  pool.query(
    query + "WHERE category.category = ?",
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );
};

export const getBySubCategory = (req: Request, res: Response) => {
  pool.query(
    query + "WHERE category.sub_category = ?",
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );
};

export default {
  ...controllers("tag", "id"),
  getMany,
  getByCategory,
  getBySubCategory,
};

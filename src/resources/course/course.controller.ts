import pool from "../../utils/db";
import { controllers, addResultsToResponse } from "../../utils/crud";
import { EC } from "../../utils/types";

export const query = `
  SELECT
    c.id,
    c.title,
    c.catalog_id AS catalogId,
    s.title AS section,
    s.instructor
  FROM
    course c
    INNER JOIN section s ON s.course_id = c.id
`;

export const getMany: EC = (_, res, next) =>
  pool.query(query, addResultsToResponse(res, next));

export const createOne: EC = (req, res, next) =>
  pool.query(
    "INSERT INTO course (title, catalog_id) VALUES ?",
    [
      {
        title: req.body.title,
        catalog_id: req.body.catalogId,
      },
    ],
    addResultsToResponse(res, next)
  );

export default {
  ...controllers("course", "id"),
  createOne,
  getMany,
};

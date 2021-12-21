import pool from "../../utils/db";
import { crud, controllers, addResultsToResponse } from "../../utils/crud";
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

const getMany: EC = (_, res, next) =>
  pool.query(query, addResultsToResponse(res, next));

export default {
  ...controllers("course", "id"),
  createOne: crud.createOne("INSERT INTO course SET ?", (req) => ({
    title: req.body.title,
    catalog_id: req.body.catalogId,
  })),
  getMany,
  updateOne: crud.updateOne("UPDATE course SET ? WHERE id = ?", (req) => [
    { title: req.body.title, catalog_id: req.body.catalogId },
    req.params.id,
  ]),
};

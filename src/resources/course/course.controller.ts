import { Request, Response } from "express";
import pool from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";
import { Query } from "mysql";

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

export const getMany = (req: Request, res: Response): Query =>
  pool.query(query, onResult({ req, res }).read);

export const createOne = (req: Request, res: Response): Query =>
  pool.query(
    "INSERT INTO course (title, catalog_id) VALUES ?",
    [
      {
        title: req.body.title,
        catalog_id: req.body.catalogId,
      },
    ],
    onResult({ req, res }).create
  );

export default {
  ...controllers("course", "id"),
  createOne,
  getMany,
};

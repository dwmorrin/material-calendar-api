import { Request, Response } from "express";
import pool from "../../utils/db";
import { controllers, onResult } from "../../utils/crud";
import { Query } from "mysql";

const query = `
  SELECT
    id,
    title,
    instructor
  FROM
    course
`;

export const getMany = (req: Request, res: Response): Query =>
  pool.query(query, onResult({ req, res }).read);

export default {
  ...controllers("course", "id"),
  getMany,
};

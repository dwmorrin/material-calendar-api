import { Request, Response, Router } from "express";
import pool, { inflate } from "../utils/db";
import { onResult } from "../utils/crud";

const query = `
  SELECT
    JSON_OBJECT(
      'title', c.title,
      'catalogId', c.catalog_id,
      'section', s.title,
      'instructor', s.instructor
    ) as course,
    JSON_OBJECT(
      'name', JSON_OBJECT(
        'first', u.first_name,
        'middle', u.middle_name,
        'last', u.last_name
      ),
      'id', u.id
    ) AS student
  FROM
    roster r LEFT JOIN user u ON r.student_id = u.id
    LEFT JOIN course c ON r.course_id = c.id
    LEFT JOIN section s ON s.course_id = c.id
`;

const getMany = (req: Request, res: Response) =>
  pool.query(query, onResult({ req, res, dataMapFn: inflate }).read);

const router = Router();

router.get("/", getMany);

export default router;

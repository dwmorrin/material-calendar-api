import pool from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import { EC } from "../../utils/types";

const getOne: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM user_view WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

const getMany: EC = (_, res, next) =>
  pool.query("SELECT * FROM user_view", addResultsToResponse(res, next));

const createOne: EC = (req, res, next) =>
  pool.query(
    "INSERT INTO user SET ?",
    [{ ...req.body }],
    addResultsToResponse(res, next)
  );

const updateOne: EC = (req, res, next) =>
  pool.query(
    "UPDATE user SET ? WHERE id = ?",
    [
      {
        ...req.body,
      },
      req.params.id,
    ],
    addResultsToResponse(res, next)
  );

const removeOne: EC = (req, res, next) =>
  pool.query(
    "DELETE FROM user WHERE id = ?",
    req.params.id,
    addResultsToResponse(res, next)
  );

//---- get resource by user id

const getCourses: EC = (req, res, next) =>
  pool.query(
    `SELECT
      c.id,
      c.title,
      c.catalog_id as catalogId,
      s.title as section,
      s.instructor
    FROM
      user u
        INNER JOIN roster r ON r.user_id = u.id
        INNER JOIN course c ON r.course_id = c.id
        INNER JOIN section s ON r.section_id = s.id
    WHERE
      u.id = ?
    `,
    [req.params.id],
    addResultsToResponse(res, next)
  );

const getProjects: EC = (req, res, next) =>
  pool.query(
    `(
      SELECT p.*
      FROM project_view p
        INNER JOIN section_project sp ON sp.project_id = p.id
        INNER JOIN roster r ON r.section_id = sp.section_id
        INNER JOIN user u ON u.id = r.user_id 
      WHERE u.id = ?
      GROUP BY p.id
    )
    UNION (SELECT * FROM project_view WHERE title = "Walk-in" )
  `,
    [req.params.id],
    addResultsToResponse(res, next)
  );

export default {
  createOne,
  getOne,
  updateOne,
  removeOne,
  getMany,
  getCourses,
  getProjects,
};

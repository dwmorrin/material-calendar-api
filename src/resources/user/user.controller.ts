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

const updateSetup: EC = (req, res, next) => {
  res.locals.roles = req.body.roles;
  next();
};

const updateOne: EC = (req, res, next) =>
  pool.query(
    "UPDATE user SET ? WHERE id = ?",
    [
      {
        user_id: req.body.username,
        restriction: req.body.restriction,
        first_name: req.body.name.first,
        middle_name: req.body.name.middle,
        last_name: req.body.name.last,
        email: req.body.email,
        phone: req.body.phone,
      },
      req.params.id,
    ],
    addResultsToResponse(res, next)
  );

// TODO: Roles currently hardcoded for admin = 1, user = 2
// update this once roles can be user defined
const insertRoles: EC = (req, res, next) => {
  const roles = res.locals.roles as ("admin" | "user")[];
  const id = Number(req.params.id);
  if (Array.isArray(roles) && roles.length) {
    pool.query(
      "REPLACE INTO user_role (user_id, role_id) VALUES ?",
      [roles.map((role) => [id, role === "admin" ? 1 : 2])],
      addResultsToResponse(res, next, { key: "ignore" })
    );
  } else next();
};

const deleteRoles: EC = (req, res, next) => {
  const roles = res.locals.roles as ("admin" | "user")[];
  const id = Number(req.params.id);
  if (Array.isArray(roles) && roles.length) {
    pool.query(
      "DELETE FROM user_role WHERE user_id = ? AND role_id NOT IN (?)",
      [id, roles.map((role) => (role === "admin" ? 1 : 2))],
      addResultsToResponse(res, next, { key: "ignore" })
    );
  } else next();
};

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

const resetPassword: EC = (req, res, next) => {
  const { password } = req.body;
  if (!password) return next(new Error("Password is required"));
  pool.query(
    `UPDATE user
    SET password = AES_ENCRYPT(?, UNHEX(SHA2(?, 512)))
    WHERE id = ?
    `,
    [password, process.env.MYSQL_SHA2_PASSPHRASE, req.params.id],
    addResultsToResponse(res, next)
  );
};

export default {
  createOne,
  getOne,
  updateOne: [updateSetup, updateOne, insertRoles, deleteRoles, getOne],
  removeOne,
  getMany,
  getCourses,
  getProjects,
  resetPassword,
};

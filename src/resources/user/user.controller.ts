import { Connection } from "mysql";
import pool, { getUnsafeMultipleStatementConnection } from "../../utils/db";
import {
  addResultsToResponse,
  crud,
  respond,
  withResource,
} from "../../utils/crud";
import { EC, EEH } from "../../utils/types";

const getOne = crud.readOne(
  "SELECT * FROM user_view WHERE id = ?",
  (req) => req.params.id
);

const getMany = crud.readMany("SELECT * FROM user_view");

const startCreateOne: EC = (_, res, next) => {
  const unsafeConnection = getUnsafeMultipleStatementConnection();
  res.locals.connection = unsafeConnection;
  unsafeConnection.beginTransaction((err) => {
    if (err) return next(err);
    next();
  });
};

const createOne: EC = (req, res, next) => {
  const connection: Connection = res.locals.connection;
  const { username, name, email, phone, restriction } = req.body;
  connection.query(
    "INSERT INTO user SET ?",
    {
      user_id: username,
      first_name: name.first,
      last_name: name.last,
      email,
      phone,
      restriction,
    },
    addResultsToResponse(res, next, { one: true, key: "user" })
  );
};

// only for new users; does not remove roles
const createRoles: EC = (req, res, next) => {
  const connection: Connection = res.locals.connection;
  const { insertId } = res.locals.user;
  const { roles } = req.body as { roles: string[] };
  const roleTable: { id: number; title: string }[] = res.locals.roles;
  const rolesToInsert = [];
  for (const role of roles) {
    const role_id = (
      roleTable.find(({ title }) => title === role) || { id: -1 }
    ).id;
    if (role_id === -1) throw new Error(`Role ${role} does not exist`);
    rolesToInsert.push({ user_id: insertId, role_id });
  }
  connection.query(
    "INSERT INTO user_role SET ?;".repeat(rolesToInsert.length),
    rolesToInsert,
    addResultsToResponse(res, next)
  );
};

const commitCreateOne: EC = (req, res, next) => {
  const connection: Connection = res.locals.connection;
  connection.commit((err) => {
    if (err) return next(err);
    connection.end((err) => {
      if (err) return next(err);
      delete res.locals.connection;
      next();
    });
  });
};

const createOneRollback: EEH = (error, _, res, next) => {
  const connection: Connection = res.locals.connection;
  if (!connection) return next(error);
  console.log("error making new user; calling rollback");
  connection.rollback(() => next(error));
};

const createOneErrorHandler: EEH = (error, _, res, next) => {
  const connection: Connection = res.locals.connection;
  if (!connection) return next(error);
  console.log("terminating create new user due to error:");
  console.log(error);
  connection.end((error2) => {
    if (error2) return next(error2);
    delete res.locals.unsafeConnection;
    next(error);
  });
};

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
    addResultsToResponse(res, next, { one: true })
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
  createOne: [
    withResource("roles", "SELECT * FROM role"),
    startCreateOne,
    createOne,
    createRoles,
    commitCreateOne,
    createOneRollback,
    createOneErrorHandler,
    respond({
      status: 201,
      data: (req, res) => ({ ...req.body, id: res.locals.user.insertId }),
    }),
  ],
  getOne,
  updateOne: [
    updateSetup,
    updateOne,
    insertRoles,
    deleteRoles,
    respond({
      status: 201,
      data: (req) => ({ ...req.body }),
    }),
  ],
  removeOne,
  getMany,
  getCourses,
  getProjects,
  resetPassword,
};

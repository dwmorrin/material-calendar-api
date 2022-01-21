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

// import

// start with same as startCreateOne - just get the unsafe connection

interface User {
  first: string;
  last: string;
  email: string;
  username: string;
  restriction: string | number;
  phone: string;
}

interface UserUpdate extends User {
  id: number;
}

function isUser(user: unknown): user is User {
  return (
    typeof user === "object" &&
    user !== null &&
    "first" in user &&
    "last" in user &&
    "email" in user &&
    "username" in user &&
    "restriction" in user &&
    "phone" in user
  );
}

interface UserRecord {
  id: number;
  user_id: string; // username
  restriction: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

// check an input vs db to see if an update is needed
function compareUserRecord(u: User, ur: UserRecord): boolean {
  return (
    u.first === ur.first_name &&
    u.last === ur.last_name &&
    u.email === ur.email &&
    u.username === ur.user_id &&
    u.restriction === ur.restriction
  );
}

// TODO remove hardcoded role values, could include role as string and lookup
const USER_ROLE_ID = 2;

const createMany: EC = (req, res, next) => {
  const existingUsers: UserRecord[] = res.locals.users;
  if (!Array.isArray(existingUsers))
    return next("Cannot import users without existing users - internal error");
  const connection: Connection = res.locals.connection;
  const users: User[] = req.body;
  if (!Array.isArray(users))
    return next("Expected array of users - not an array");
  if (!users.every(isUser)) {
    return next("Expected array of users - data invalid");
  }
  // import assumed to have duplicate users for each section they are enrolled in
  // first we will reduce the array to unique users, and take the highest restriction level
  const seen = new Set<string>();
  const uniqueUsers = users.reduce((acc, user) => {
    if (seen.has(user.username)) {
      const existing = acc.find((u) => u.username === user.username);
      if (!existing) throw "Internal error"; // this should never happen
      existing.restriction = Math.max(
        Number(existing.restriction),
        Number(user.restriction)
      );
      return acc;
    }
    seen.add(user.username);
    acc.push(user);
    return acc;
  }, [] as User[]);
  const [inserts, updates] = uniqueUsers.reduce(
    ([inserts, updates], user) => {
      const existing = existingUsers.find((u) => u.user_id === user.username);
      if (!existing) {
        inserts.push(user);
        return [inserts, updates];
      }
      if (compareUserRecord(user, existing)) return [inserts, updates]; // nothing to do here
      updates.push({ ...user, id: existing.id });
      return [inserts, updates];
    },
    [[], []] as [User[], UserUpdate[]]
  );
  const sql = "INSERT IGNORE INTO user SET ?;";
  connection.query(
    inserts.length ? sql.repeat(inserts.length) : "SELECT 1",
    inserts.map((u) => ({
      first_name: u.first,
      last_name: u.last,
      email: u.email,
      restriction: u.restriction,
      user_id: u.username,
      phone: u.phone,
    })),
    (err) => {
      if (err) return next(err);
      connection.query(
        "SELECT id FROM user WHERE user_id in (?)",
        [inserts.map((u) => u.username)],
        (err, results) => {
          if (err) return next(err);
          connection.query(
            "INSERT IGNORE INTO user_role SET ?;".repeat(inserts.length),
            (results as { id: number }[]).map((r) => ({
              user_id: r.id,
              role_id: USER_ROLE_ID,
            })),
            (err) => {
              if (err) return next(err);
              connection.query(
                updates.length
                  ? "UPDATE user SET ? WHERE id = ?;".repeat(updates.length)
                  : "SELECT 1",
                updates
                  .map(
                    ({
                      id,
                      first,
                      last,
                      email,
                      username,
                      restriction,
                      phone,
                    }) => [
                      {
                        first_name: first,
                        last_name: last,
                        email,
                        user_id: username,
                        restriction,
                        phone,
                      },
                      id,
                    ]
                  )
                  .flat(),
                (err) => {
                  if (err) return next(err);
                  next();
                }
              );
            }
          );
        }
      );
    }
  );
};

// end import

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

// @throws
const getRoleIds: (
  roles: string[],
  records: { id: number; title: string }[]
) => number[] = (roles, records) => {
  return roles.map((role) => {
    const roleRecord = records.find(({ title }) => title === role);
    if (!roleRecord) throw new Error(`Role ${role} does not exist`);
    return roleRecord.id;
  });
};

const insertRoles: EC = (req, res, next) => {
  const roles = req.body.roles as string[];
  const roleRecords = res.locals.roles as { id: number; title: string }[];
  try {
    const roleIds = getRoleIds(roles, roleRecords);
    const id = Number(req.params.id);
    if (Array.isArray(roleIds) && roleIds.length) {
      pool.query(
        "REPLACE INTO user_role (user_id, role_id) VALUES ?",
        [roleIds.map((roleId) => [id, roleId])],
        addResultsToResponse(res, next, { key: "ignore" })
      );
    } else next();
  } catch (error) {
    next(error);
  }
};

const deleteRoles: EC = (req, res, next) => {
  const roles = req.body.roles as string[];
  const roleRecords = res.locals.roles as { id: number; title: string }[];
  try {
    const roleIds = getRoleIds(roles, roleRecords);
    const id = Number(req.params.id);
    if (Array.isArray(roles) && roles.length) {
      pool.query(
        "DELETE FROM user_role WHERE user_id = ? AND role_id NOT IN (?)",
        [id, roleIds],
        addResultsToResponse(res, next, { key: "ignore" })
      );
    } else next();
  } catch (error) {
    next(error);
  }
};

const removeOne: EC = (req, res, next) =>
  pool.query(
    "DELETE FROM user WHERE id = ?",
    req.params.id,
    addResultsToResponse(res, next)
  );

//---- get resource by user id

const getCoursesForInstructorsQuery = `
  SELECT
    c.id,
    c.title,
    c.catalog_id as catalogId,
    s.title as section,
    s.instructor_id as instructor
  FROM
    user u
      INNER JOIN section s ON s.instructor_id = u.id
      INNER JOIN course c ON s.course_id = c.id
  WHERE
    u.id = ?
  `;

const getCoursesForStudentsQuery = `
  SELECT
    c.id,
    c.title,
    c.catalog_id as catalogId,
    s.title as section,
    s.instructor_id as instructor
  FROM
    user u
      INNER JOIN roster r ON r.user_id = u.id
      INNER JOIN course c ON r.course_id = c.id
      INNER JOIN section s ON r.section_id = s.id
  WHERE
    u.id = ?
  `;

//! TODO moving instructor as string to instructor_id (int, user.id)
const getCourses: EC = (req, res, next) =>
  pool.query(
    res.locals.user.roles.includes("instructor")
      ? getCoursesForInstructorsQuery
      : getCoursesForStudentsQuery,
    [req.params.id],
    addResultsToResponse(res, next)
  );

const getProjectsForStudentsQuery = `(
      SELECT p.*
      FROM project_view p
        INNER JOIN section_project sp ON sp.project_id = p.id
        INNER JOIN roster r ON r.section_id = sp.section_id
        INNER JOIN user u ON u.id = r.user_id 
      WHERE u.id = ?
      GROUP BY p.id
    )
    UNION (SELECT * FROM project_view WHERE title = "Walk-in" )
  `;

// TODO remove hardcoded IDs for walk-in and class meeting projects
const getProjectsForInstructorsQuery =
  "SELECT * FROM project_view WHERE id in (1, 2)";

const getProjects: EC = (req, res, next) =>
  pool.query(
    res.locals.user.roles.includes("instructor")
      ? getProjectsForInstructorsQuery
      : getProjectsForStudentsQuery,
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
  import: [
    withResource("users", "SELECT * FROM user"), // not the view; raw users
    startCreateOne,
    createMany,
    commitCreateOne,
    createOneRollback,
    createOneErrorHandler,
    withResource("users", "SELECT * FROM user_view"),
    respond({
      status: 201,
      data: (_, res) => res.locals.users,
    }),
  ],
  updateOne: [
    withResource("roles", "SELECT * FROM role"),
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

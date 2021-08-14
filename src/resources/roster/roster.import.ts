/* eslint-disable no-console */
/**
 * Rosters connect users to courses, sections, and projects.
 * The roster input file includes a list of users, courses, sections, and project titles.
 *
 * The import should:
 *  * be able to run multiple times without duplicating data
 *  * not delete any data
 *  * update existing data where possible and safe to do so
 *
 * Step 1: gather current relevant data from the database
 *  Uses withResource and some custom functions in this file.
 * Step 2: compare the input data to the current data
 *  See the ./processors.ts file
 * Step 3: make inserts where needed
 *  See the ./inserts.ts file
 * Step 4: make updates where needed
 *  See the ./updates.ts file
 * Step 5: gather updated data from the database
 *  Uses withResource
 * Step 6: return the updated data to the client
 */

import { NextFunction, Request, Response } from "express";
import pool, { inflate, getUnsafeMultipleStatement } from "../../utils/db";
import { withResource } from "../../utils/crud";
import withActiveSemester from "../../utils/withActiveSemester";
import { query as courseQuery } from "../course/course.controller";
import { Connection, MysqlError } from "mysql";
import {
  projectQuery,
  userQuery,
  sectionQuery,
  rosterInputQuery,
} from "./roster.query";
import {
  RosterInputHashTable,
  RosterInserts,
  RosterRecordInput,
  RosterUpdates,
} from "./types";
import { EC } from "../../utils/types";
import {
  processCourse,
  processProject,
  processRoster,
  processSection,
  processUser,
} from "./processors";
import {
  insertCourses,
  insertSections,
  insertProjects,
  insertSectionProjects,
  insertUsers,
  insertRosterRecords,
  insertUserRoles,
  insertWalkIns,
} from "./inserts";
import { updateCourses, updateSections, updateUsers } from "./updates";

const setup: EC = (req, res, next) => {
  if (!Array.isArray(req.body)) return next("no input records");
  res.locals.inputRecords = req.body;
  const seen: RosterInputHashTable = {
    course: {},
    project: {},
    rosterRecord: {},
    section: {},
    sectionProject: {},
    user: {},
  };
  res.locals.seen = seen;
  const inserts: RosterInserts = {
    sectionProjects: [],
    courses: [],
    projects: [],
    roles: [],
    rosterRecords: [],
    sections: [],
    users: [],
    walkInGroups: [],
  };
  res.locals.inserts = inserts;
  const updates: RosterUpdates = {
    courses: [],
    sections: [],
    users: [],
  };
  res.locals.updates = updates;
  res.locals.unsafeMultiStatementPool = getUnsafeMultipleStatement();
  next();
};

const withRosterRecords: EC = (_, res, next) => {
  const { id } = res.locals.semester;
  pool.query(rosterInputQuery, [id], (error, results) => {
    if (error) return next(error);
    res.locals.rosterRecords = results;
    next();
  });
};

// assumes all entries on the roster should have a minimal role of "user"
const withUserRole: EC = (_, res, next) => {
  pool.query("SELECT id FROM role WHERE title = 'user'", (error, results) => {
    if (error) return next(error);
    if (!results.length) return next(new Error('no role named "user" exists'));
    const { id } = results[0];
    res.locals.userRoleId = id;
    next();
  });
};

const processInputRecords: EC = (_, res, next) => {
  const inputRecords: RosterRecordInput[] = res.locals.inputRecords;
  if (!inputRecords.length) return next();
  inputRecords.forEach((record: RosterRecordInput): void => {
    const course = processCourse(res, record);
    const section = processSection(res, record, course);
    processProject(res, record, course, section);
    processRoster(res, record);
    processUser(res, record);
  });
  next();
};

/**
 * roster import is done; respond with success
 */
function successResponder(_: Request, res: Response): void {
  (res.locals.unsafeMultiStatementPool as Connection).end();
  res.status(201).json({
    data: {
      courses: res.locals.courses.map(inflate),
      groups: res.locals.groups.map(inflate),
      projects: res.locals.projects.map(inflate),
      rosterRecords: res.locals.rosterRecords.map(inflate),
      sections: res.locals.sections.map(inflate),
      users: res.locals.users.map(inflate),
    },
  });
}

function mySqlErrorResponder(
  error: Error & MysqlError,
  _: Request,
  res: Response,
  next: NextFunction
): void {
  if (error.code && error.errno) {
    if (res.locals.unsafeMultiStatementPool)
      (res.locals.unsafeMultiStatementPool as Connection).end();
    // mysql error
    console.error("MYSQL ERROR");
    console.error(error);
    console.error("END MYSQL ERROR");
    const message = `Database error: (${error.code}[${error.errno}]${
      process.env.NODE_ENV === "development" ? `: ${error.sql}` : ""
    })`;
    res.status(500).json({ error: { message } });
  } else next(error);
}

/**
 * roster import failed; respond with error
 */
function errorResponder(
  error: Error,
  _: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  __: NextFunction
): void {
  if (res.locals.unsafeMultiStatementPool)
    (res.locals.unsafeMultiStatementPool as Connection).end();
  // eslint-disable-next-line no-console
  console.error("UNHANDLED ERROR");
  console.error(error);
  console.error("END UNHANDLED ERROR");
  res.status(500).json({ error });
}

// middleware stack to process roster import
export default [
  setup,
  withActiveSemester,
  withUserRole,
  withRosterRecords,
  withResource("courses", courseQuery),
  withResource("sections", sectionQuery),
  withResource("users", userQuery),
  withResource("projects", projectQuery),
  processInputRecords,
  insertCourses,
  insertSections,
  insertProjects,
  insertSectionProjects,
  insertUsers,
  insertUserRoles,
  insertRosterRecords,
  insertWalkIns,
  updateCourses,
  updateSections,
  updateUsers,
  withResource("courses", courseQuery),
  withResource("groups", "SELECT * FROM project_group_view"),
  withResource("projects", "SELECT * FROM project_view"),
  withResource("rosterRecords", "SELECT * FROM roster_view"),
  withResource("sections", "SELECT * FROM section_view"),
  withResource("users", "SELECT * FROM user_view"),
  successResponder,
  mySqlErrorResponder,
  errorResponder,
];

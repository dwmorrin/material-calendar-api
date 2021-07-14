/**
 * Rosters connect users to courses and sections.
 * The roster input file includes a list of users, courses, sections,
 * and project titles.
 * All of the new information is inserted into the database, and then
 * roster entries can be made once all IDs are known.
 */

import { NextFunction, Request, Response } from "express";
import pool, { inflate } from "../db";
import { query as courseQuery } from "../../resources/course/course.controller";
import { getActive } from "../../resources/semester/semester.query";
import { MysqlError } from "mysql";

interface Section {
  id: number;
  courseId: number;
  title: string;
  instructor: string;
}

interface User {
  id: number;
  username: string;
  name: { first: string; last: string };
  restriction: number;
}

interface Course {
  id: number;
  title: string;
  catalogId: string;
}

/**
 * Holds intermediate data for the roster import.
 * As data is inserted, any missing IDs are updated.
 */
interface PendingRosterRecord {
  user: {
    id?: number;
    username: string;
  };
  course: {
    id?: number;
    title: string;
    section: {
      id?: number;
      title: string;
    };
  };
}

function makeFriendlyMySQLError(error: MysqlError, label: string) {
  return new Error(`Database error: ${label} (${error.code}[${error.errno}])`);
}

function setup(req: Request, res: Response, next: NextFunction): void {
  if (!Array.isArray(req.body.records)) return next(new Error("no records"));
  res.locals.inputRecords = req.body.records;
  res.locals.rosterRecords = []; // PendingRosterRecord[]
  // tracks unique records by key
  res.locals.seen = {
    course: {}, // { [title]: true }
    user: {}, // { [username]: true }
    rosterRecord: {}, // { [username + course + section]: true }
    project: {}, // { [title]: true
    section: {}, // { [course + title]: true
  };
  res.locals.inserts = {
    courses: [],
    projects: [],
    users: [],
    sections: [],
    roles: [],
  };
  res.locals.updates = {
    courses: [],
    users: [],
    sections: [],
  };
  next();
}

// assumes roster entries and project start/end should be in the active semester
function withActiveSemester(
  _: Request,
  res: Response,
  next: NextFunction
): void {
  pool.query(getActive, (err, results) => {
    if (err)
      return next(makeFriendlyMySQLError(err, "getting active semester"));
    if (!results.length) return next(new Error("no active semester"));
    const { id, start, end } = results[0];
    res.locals.semester = { id, start, end };
    next();
  });
}

// assumes all entries on the roster should have a minimal role of "user"
function withUserRole(_: Request, res: Response, next: NextFunction): void {
  pool.query("SELECT id FROM role WHERE title = 'user'", (err, results) => {
    if (err)
      return next(makeFriendlyMySQLError(err, 'getting the "user" role'));
    if (!results.length) return next(new Error('no role named "user" exists'));
    const { id } = results[0];
    res.locals.userRoleId = id;
    next();
  });
}

function withResource(key: string, query: string) {
  return function (_: Request, res: Response, next: NextFunction) {
    pool.query(query, (error, results) => {
      if (error) return next(makeFriendlyMySQLError(error, `getting ${key}`));
      res.locals[key] = results.map(inflate);
      next();
    });
  };
}

function processInputRecords(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const record = res.locals.inputRecords.shift();
  if (!record) return next();
  const {
    Course,
    Catalog,
    Section,
    Instructor,
    Student,
    NetID,
    Restriction,
    Project,
  } = record;

  const courses = res.locals.courses as Course[];
  let course;
  if (!(Course in res.locals.seen.course)) {
    res.locals.seen.course[Course] = true;
    course = courses.find(({ title }) => title === Course);
    // if no course, create it
    if (!course)
      res.locals.inserts.courses.push({
        title: Course,
        catalogId: Catalog,
      });
    // catalog should match course catalog, else update course
    else if (course.catalogId !== Catalog)
      res.locals.updates.courses.push({
        id: course.id,
        title: Course,
        catalogId: Catalog,
      });
  }

  const sections = res.locals.sections as Section[];
  let section;
  if (!(Section in res.locals.seen.section)) {
    res.locals.seen.section[Section] = true;
    section = sections.find(
      ({ title, courseId }) =>
        courses.find(({ id }) => id === courseId) && title === Section
    );
    // if no section, create it
    if (!section)
      res.locals.inserts.sections.push({
        title: Section,
        courseTitle: Course,
        instructor: Instructor,
      });
    // instructor should match section instructor, else update section
    else if (section.instructor !== Instructor)
      res.locals.updates.sections.push({
        id: section.id,
        title: Section,
        instructor: Instructor,
      });
  }

  const users = res.locals.users as User[];
  let user;
  if (!(NetID in res.locals.seen.user)) {
    res.locals.seen.user[NetID] = true;
    user = users.find(({ username }) => username === NetID);
    // name is a comma separated string: "last, first"
    const [last = "", first = ""] = Student.trim().split(/\s*,\s*/);
    // if user is not found, create new user
    if (!user) {
      res.locals.inserts.users.push({
        username: NetID,
        name: { first, last },
        restriction: Restriction,
      });
      // and give the user the "user" role
      res.locals.inserts.roles.push({
        username: NetID,
      });
    }
    // if name does not match or restriction does not match, update user
    else if (
      user.name.first !== first ||
      user.name.last !== last ||
      user.restriction !== Restriction
    )
      res.locals.updates.users.push({
        id: user.id,
        username: NetID,
        name: { first, last },
        restriction: Restriction,
      });
  }

  const projects = res.locals.projects as { title: string }[];
  if (!(Project in res.locals.seen.project)) {
    res.locals.seen.project[Project] = true;
    const project = projects.find(({ title }) => title === Project);
    // if project not found, create new project
    if (!project) res.locals.inserts.projects.push({ title: Project });
  }

  // create pending roster records
  const key = `${Course}${Section}${NetID}`;
  if (!(key in res.locals.seen.rosterRecord)) {
    res.locals.seen.rosterRecord[key] = true;
    res.locals.rosterRecords.push({
      user: user
        ? { id: user.id, username: user.username }
        : { username: NetID },
      course: course
        ? {
            id: course.id,
            title: course.title,
            section: section
              ? { id: section.id, title: section.title }
              : { title: Section },
          }
        : { title: Course, section: { title: Section } },
    });
  }

  // continue to next record
  processInputRecords(req, res, next);
}

/**
 * Iterate through res.locals.inserts, and insert the records into the database.
 * Pending records needing IDs are update with the IDs.
 */
function processInserts(req: Request, res: Response, next: NextFunction): void {
  if (res.locals.inserts.courses.length) {
    const course = res.locals.inserts.courses.shift();
    pool.query(
      "INSERT INTO course SET ?",
      [{ title: course.title, catalog_id: course.catalogId }],
      (error, result) => {
        if (error)
          return next(
            makeFriendlyMySQLError(error, `inserting course ${course.title}`)
          );
        // update all the pending records with the new course id
        res.locals.rosterRecords = (
          res.locals.rosterRecords as PendingRosterRecord[]
        ).map((r) => {
          if (r.course.title === course.title) r.course.id = result.insertId;
          return r;
        });
        return processInserts(req, res, next);
      }
    );
  } else if (res.locals.inserts.projects.length) {
    const project = res.locals.inserts.projects.shift();
    // since file contains no dates, we assume interval is current semester
    const { start, end } = res.locals.semester;
    // similarly, just assume all projects are active and group details are 0
    pool.query(
      "INSERT INTO project SET ?",
      [
        {
          title: project.title,
          start,
          end,
          book_start: start,
          group_hours: 0,
          group_size: 0,
          open: true,
        },
      ],
      (error) => {
        if (error)
          return next(
            makeFriendlyMySQLError(error, `inserting project ${project.title}`)
          );
        // projects are independent of roster records; nothing to do here
        return processInserts(req, res, next);
      }
    );
  } else if (res.locals.inserts.users.length) {
    const user = res.locals.inserts.users.shift();
    pool.query(
      "INSERT INTO user SET ?",
      [
        {
          first_name: user.name.first,
          last_name: user.name.last,
          user_id: user.username,
          restriction: user.restriction,
        },
      ],
      (error, result) => {
        if (error)
          return next(
            makeFriendlyMySQLError(error, `inserting user ${user.username}`)
          );
        // update all the pending records with the new user id
        res.locals.rosterRecords = (
          res.locals.rosterRecords as PendingRosterRecord[]
        ).map((r) => {
          if (r.user.username === user.username) r.user.id = result.insertId;
          return r;
        });
        // and give the user the "user" role
        res.locals.inserts.roles = (
          res.locals.inserts.roles as { id?: number; username: string }[]
        ).map((r) => {
          if (r.username === user.username) r.id = result.insertId;
          return r;
        });
        return processInserts(req, res, next);
      }
    );
  } else if (res.locals.inserts.roles.length) {
    const role = res.locals.inserts.roles.shift();
    pool.query(
      "INSERT INTO user_role SET ?",
      [{ user_id: role.id, role_id: res.locals.userRoleId }],
      (error) => {
        if (error)
          return next(
            makeFriendlyMySQLError(
              error,
              `inserting role for user ${role.username}`
            )
          );
        return processInserts(req, res, next);
      }
    );
  } else if (res.locals.inserts.sections.length) {
    const section = res.locals.inserts.sections.shift();
    // this query requires all courses to be inserted first
    pool.query(
      `INSERT INTO section SET title = ?, instructor = ?, course_id = (
        SELECT id FROM course WHERE title = ?
      )`,
      [section.title, section.instructor, section.courseTitle],
      (error, result) => {
        if (error)
          return next(
            makeFriendlyMySQLError(
              error,
              `inserting section ${section.title} ${section.instructor}`
            )
          );
        res.locals.rosterRecords = (
          res.locals.rosterRecords as PendingRosterRecord[]
        ).map((r) => {
          if (r.course.title === section.courseTitle)
            r.course.section.id = result.insertId;
          return r;
        });
        return processInserts(req, res, next);
      }
    );
  } else {
    next();
  }
}

function processUpdates(req: Request, res: Response, next: NextFunction): void {
  if (res.locals.updates.courses.length) {
    const course = res.locals.updates.courses.shift();
    pool.query(
      "UPDATE course SET ? WHERE id = ?",
      [{ title: course.title, catalog_id: course.catalogId }],
      (error) => {
        if (error)
          return next(
            makeFriendlyMySQLError(error, `updating course ${course.title}`)
          );
        return processUpdates(req, res, next);
      }
    );
  } else if (res.locals.updates.sections.length) {
    const section = res.locals.updates.sections.shift();
    pool.query(
      `UPDATE section SET ? WHERE id = ?`,
      [{ title: section.title, instructor: section.instructor }, section.id],
      (error) => {
        if (error)
          return next(
            makeFriendlyMySQLError(
              error,
              `updating section ${section.title} ${section.instructor}`
            )
          );
        return processUpdates(req, res, next);
      }
    );
  } else if (res.locals.updates.users.length) {
    const user = res.locals.updates.users.shift();
    pool.query(
      "UPDATE user SET ? WHERE id = ?",
      [
        {
          first_name: user.name.first,
          last_name: user.name.last,
          restriction: user.restriction,
        },
        user.id,
      ],
      (error) => {
        if (error)
          return next(
            makeFriendlyMySQLError(error, `updating user ${user.username}`)
          );
        return processUpdates(req, res, next);
      }
    );
  } else {
    next();
  }
}

function processRosterRecords(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.locals.rosterRecords.length) {
    const record = res.locals.rosterRecords.shift();
    const { user, course } = record;
    // ignoring duplicates for now
    pool.query(
      `INSERT IGNORE INTO roster (
        student_id, course_id, section_id, semester_id
      ) VALUES (?, ?, ?, ?)`,
      [user.id, course.id, course.section.id, res.locals.semester.id],
      (error) => {
        if (error)
          return next(
            makeFriendlyMySQLError(error, "inserting roster entries")
          );
        return processRosterRecords(req, res, next);
      }
    );
  } else {
    next();
  }
}

/**
 * roster import is done; respond with success
 */
function successResponder(_: Request, res: Response): void {
  res.status(201).json({ data: "ok" });
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
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({ error });
}

// only need limited set of info about users
const userQuery = `
  SELECT
    id,
    user_id as username,
    JSON_OBJECT(
      'first', first_name,
      'middle', middle_name,
      'last', last_name
    ) as name,
    restriction
  FROM user
`;

// middleware stack to process roster import
export default [
  setup,
  withActiveSemester,
  withUserRole,
  withResource("courses", courseQuery),
  withResource(
    "sections",
    "SELECT id, course_id as courseId, title, instructor FROM section"
  ),
  withResource("users", userQuery),
  withResource("projects", "SELECT title FROM project"),
  processInputRecords,
  processInserts,
  processUpdates,
  processRosterRecords,
  successResponder,
  errorResponder,
];

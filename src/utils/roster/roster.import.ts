/**
 * Rosters connect users to courses and sections.
 * The roster input file includes a list of users, courses, sections,
 * and project titles.
 * All of the new information is inserted into the database, and then
 * roster entries can be made once all IDs are known.
 *
 * Projects are scoped to courses, but the database roster entry does not include
 * project information.  This causes a bit of complexity for this import
 * as we want to avoid duplicate roster entries when projects span multiple
 * sections and the project title appears many times in the input records.
 */

import { NextFunction, Request, Response } from "express";
import pool from "../db";
import { withResource } from "../crud";
import { query as courseQuery } from "../../resources/course/course.controller";
import { getActive } from "../../resources/semester/semester.query";
import { MysqlError } from "mysql";
import { writeFile } from "fs";
import rosterRecordQuery, {
  userQuery,
  sectionQuery,
  rosterInputQuery,
} from "./roster.query";
import { userQueryFn } from "../../resources/user/user.query";

interface RosterRecordInput {
  Course: string;
  Catalog: string;
  Section: string;
  Instructor: string;
  Student: string;
  NetID: string;
  Restriction: string;
  Project: string;
}
interface Section {
  id?: number;
  title: string;
  instructor: string;
  course: {
    id?: number;
    title: string;
  };
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

interface CourseSectionProject {
  course: { id?: number; title: string };
  section: { id?: number; title: string };
  project: { id?: number; title: string };
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

function setup(req: Request, res: Response, next: NextFunction): void {
  if (!Array.isArray(req.body.records)) return next(new Error("no records"));
  res.locals.inputRecords = req.body.records;
  // tracks unique records by key
  res.locals.seen = {
    course: {}, // { [title]: Course }
    project: {}, // { [project + course + section]: true }
    projectCourse: {}, // { [project + course]: Project }
    rosterRecord: {}, // { [user + course + section]: true
    section: {}, // { [course + title]: Section }
    user: {}, // { [username]: User }
  };
  res.locals.inserts = {
    courseSectionProjects: [],
    courses: [],
    projects: [],
    roles: [],
    rosterRecords: [], // PendingRosterRecord[]
    sections: [],
    users: [],
  };
  res.locals.updates = {
    courses: [],
    sections: [],
    users: [],
  };
  res.locals.report = {
    errors: 0,
    inserts: {
      courses: 0,
      projects: 0,
      rosterRecords: 0,
      sections: 0,
      users: 0,
    },
    updates: {
      courses: 0,
      sections: 0,
      users: 0,
    },
  };
  next();
}

// assumes roster entries and project start/end should be in the active semester
function withActiveSemester(
  _: Request,
  res: Response,
  next: NextFunction
): void {
  pool.query(getActive, (error, results) => {
    if (error) return next(error);
    if (!results.length) return next(new Error("no active semester"));
    const { id, start, end } = results[0];
    res.locals.semester = { id, start, end };
    next();
  });
}

function withRosterRecords(
  _: Request,
  res: Response,
  next: NextFunction
): void {
  const { id } = res.locals.semester;
  pool.query(rosterInputQuery, [id], (error, results) => {
    if (error) return next(error);
    res.locals.rosterRecords = results;
    next();
  });
}

// assumes all entries on the roster should have a minimal role of "user"
function withUserRole(_: Request, res: Response, next: NextFunction): void {
  pool.query("SELECT id FROM role WHERE title = 'user'", (error, results) => {
    if (error) return next(error);
    if (!results.length) return next(new Error('no role named "user" exists'));
    const { id } = results[0];
    res.locals.userRoleId = id;
    next();
  });
}

function processInputRecords(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const record = (res.locals.inputRecords as RosterRecordInput[]).shift();
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
  if (!(Course in res.locals.seen.course)) {
    const course = courses.find(({ title }) => title === Course) || {
      id: undefined,
      title: Course,
      catalogId: Catalog,
    };
    res.locals.seen.course[Course] = course;
    // if no course, create it
    if (!course.id) res.locals.inserts.courses.push(course);
    // catalog should match course catalog, else update course
    else if (course.catalogId !== Catalog)
      res.locals.updates.courses.push(course);
  }
  const course = res.locals.seen.course[Course];

  // this key ignores instructor, which we assume to be the same for all course sections
  const sectionKey = Course + Section;
  if (!(sectionKey in res.locals.seen.section)) {
    const sections = res.locals.sections as Section[];
    const section = sections.find(
      ({ title, course }) => course.title === Course && title === Section
    ) || {
      id: undefined,
      title: Section,
      instructor: Instructor,
      course: {
        id: course?.id,
        title: Course,
      },
    };
    res.locals.seen.section[sectionKey] = section;
    // if no section, create it
    if (!section.id) res.locals.inserts.sections.push(section);
    // instructor should match section instructor, else update section
    else if (section.instructor !== Instructor)
      res.locals.updates.sections.push(section);
  }
  const section = res.locals.seen.section[sectionKey];

  if (!(NetID in res.locals.seen.user)) {
    // name is a comma separated string: "last, first"
    const [last = "", first = ""] = Student.trim().split(/\s*,\s*/);
    const users = res.locals.users as User[];
    const user = users.find(({ username }) => username === NetID) || {
      id: undefined,
      username: NetID,
      name: {
        last,
        first,
        middle: "",
      },
      restriction: Restriction,
    };
    res.locals.seen.user[NetID] = user;
    // if user is not found, create new user
    if (!user.id) {
      res.locals.inserts.users.push(user);
      // and give the user the "user" role
      res.locals.inserts.roles.push(user);
    }
    // if name does not match or restriction does not match, update user
    else if (
      user.name.first !== first ||
      user.name.last !== last ||
      user.restriction !== Number(Restriction)
    )
      res.locals.updates.users.push(user);
  }
  const user = res.locals.seen.user[NetID];

  const projects = res.locals.projects as { id: number; title: string }[];
  const projectKey = Project + Course + Section;
  if (!(projectKey in res.locals.seen.project)) {
    const project = projects.find(({ title }) => title === Project) || {
      id: undefined,
      title: Project,
    };
    res.locals.seen.project[projectKey] = project;
    // later we need to join the section and project
    res.locals.inserts.courseSectionProjects.push({
      course: { title: Course, id: course?.id },
      section: { title: Section, id: section?.id },
      project: { title: Project, id: project?.id },
    });
    // check if project exists, currently title is unique
    const projectCourseKey = Project;
    if (!(projectCourseKey in res.locals.seen.projectCourse)) {
      res.locals.seen.projectCourse[projectCourseKey] = true;
      // if project not found, create new project
      if (!project.id)
        res.locals.inserts.projects.push({
          title: Project,
          section: { title: Section, id: section?.id },
          course: { title: Course, id: course?.id },
        });
    }
    // we don't have enough info to update projects
  }

  // create pending roster records
  // projects can span multiple sections, so Project not included in key
  const rosterKey = Course + Section + NetID;
  if (!(rosterKey in res.locals.seen.rosterRecord)) {
    res.locals.seen.rosterRecord[rosterKey] = true;
    const record = (res.locals.rosterRecords as RosterRecordInput[]).find(
      (r) => r.Course === Course && r.Section === Section && r.NetID === NetID
    );
    if (!record)
      res.locals.inserts.rosterRecords.push({
        user: { id: user?.id, username: NetID },
        course: {
          id: course?.id,
          title: Course,
          section: { id: section?.id, title: Section },
        },
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
  const counter = res.locals.report.inserts;
  if (res.locals.inserts.courses.length) {
    const course = res.locals.inserts.courses.shift();
    pool.query(
      "INSERT INTO course SET ?",
      [{ title: course.title, catalog_id: course.catalogId }],
      (error, result) => {
        if (error) return next(error);
        ++counter.courses;
        // update all the pending records with the new course id
        res.locals.inserts.rosterRecords = (
          res.locals.inserts.rosterRecords as PendingRosterRecord[]
        ).map((r) => {
          if (r.course.title === course.title) r.course.id = result.insertId;
          return r;
        });
        // update any sections that reference the new course
        res.locals.inserts.sections = (
          res.locals.inserts.sections as Section[]
        ).map((s) => {
          if (s.course.title === course.title) s.course.id = result.insertId;
          return s;
        });
        // update any projects that reference this course
        res.locals.inserts.courseSectionProjects = (
          res.locals.inserts.courseSectionProjects as CourseSectionProject[]
        ).map((csp) => {
          if (csp.course.title === course.title)
            csp.course.id = result.insertId;
          return csp;
        });
        return processInserts(req, res, next);
      }
    );
  } else if (res.locals.inserts.sections.length) {
    const section = res.locals.inserts.sections.shift();
    // this query requires all courses to be inserted first
    pool.query(
      "INSERT INTO section SET title = ?, instructor = ?, course_id = ?",
      [section.title, section.instructor, section.course.id],
      (error, result) => {
        if (error) return next(error);
        ++counter.sections;
        // update all the pending records with the new section id
        res.locals.inserts.rosterRecords = (
          res.locals.inserts.rosterRecords as PendingRosterRecord[]
        ).map((r) => {
          if (
            r.course.section.title === section.title &&
            r.course.title === section.course.title
          )
            r.course.section.id = result.insertId;
          return r;
        });
        // update any projects that reference the section
        res.locals.inserts.courseSectionProjects = (
          res.locals.inserts.courseSectionProjects as CourseSectionProject[]
        ).map((csp) => {
          if (
            csp.course.title === section.course.title &&
            csp.section.title === section.title
          )
            csp.section.id = result.insertId;
          return csp;
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
      (error, result) => {
        if (error) return next(error);
        ++counter.projects;
        // update course/section/project records with the new project id
        res.locals.inserts.courseSectionProjects = (
          res.locals.inserts.courseSectionProjects as CourseSectionProject[]
        ).map((csp) => {
          if (csp.project.title === project.title)
            csp.project.id = result.insertId;
          return csp;
        });
        return processInserts(req, res, next);
      }
    );
  } else if (res.locals.inserts.courseSectionProjects.length) {
    const csp = res.locals.inserts.courseSectionProjects.shift();
    if (!csp.project.id || !csp.section.id) {
      // if project or section not found, try again
      return processInserts(req, res, next);
    }
    // ignoring duplicates for now
    pool.query(
      `INSERT IGNORE INTO section_project SET ?`,
      [
        {
          project_id: csp.project.id,
          section_id: csp.section.id,
        },
      ],
      (error) => {
        if (error) return next(error);
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
        if (error) return next(error);
        ++counter.users;
        // update all the pending records with the new user id
        res.locals.inserts.rosterRecords = (
          res.locals.inserts.rosterRecords as PendingRosterRecord[]
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
        if (error) return next(error);
        return processInserts(req, res, next);
      }
    );
  } else if (res.locals.inserts.rosterRecords.length) {
    const record = res.locals.inserts.rosterRecords.shift();
    const { user, course } = record;
    pool.query(
      `INSERT INTO roster (
        user_id, course_id, section_id, semester_id
      ) VALUES (?, ?, ?, ?)`,
      [user.id, course.id, course.section.id, res.locals.semester.id],
      (error) => {
        if (error) return next(error);
        ++counter.rosterRecords;
        return processInserts(req, res, next);
      }
    );
  } else {
    next();
  }
}

function processUpdates(req: Request, res: Response, next: NextFunction): void {
  const counter = res.locals.report.updates;
  if (res.locals.updates.courses.length) {
    const course = res.locals.updates.courses.shift();
    pool.query(
      "UPDATE course SET ? WHERE id = ?",
      [{ title: course.title, catalog_id: course.catalogId }],
      (error) => {
        if (error) return next(error);
        ++counter.courses;
        return processUpdates(req, res, next);
      }
    );
  } else if (res.locals.updates.sections.length) {
    const section = res.locals.updates.sections.shift();
    pool.query(
      `UPDATE section SET ? WHERE id = ?`,
      [{ title: section.title, instructor: section.instructor }, section.id],
      (error) => {
        if (error) return next(error);
        ++counter.sections;
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
        if (error) return next(error);
        ++counter.users;
        return processUpdates(req, res, next);
      }
    );
  } else {
    next();
  }
}

// for debugging
function logToFile(req: Request, res: Response, next: NextFunction): void {
  writeFile("./dump.json", JSON.stringify(res.locals, null, 2), (error) => {
    if (error) return next(error);
    return next();
  });
}

/**
 * roster import is done; respond with success
 */
function successResponder(_: Request, res: Response): void {
  res.status(201).json({
    data: {
      courses: res.locals.courses,
      projects: res.locals.projects,
      users: res.locals.users,
      rosterRecords: res.locals.rosterRecords,
      report: res.locals.report,
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
  withResource("projects", "SELECT id, title FROM project"),
  processInputRecords,
  processInserts,
  processUpdates,
  // logToFile,
  withResource("courses", courseQuery),
  withResource("projects", "SELECT * FROM project_view"),
  withResource("users", userQueryFn()),
  withResource("rosterRecords", rosterRecordQuery),
  successResponder,
  mySqlErrorResponder,
  errorResponder,
];

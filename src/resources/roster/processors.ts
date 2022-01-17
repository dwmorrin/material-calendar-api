/**
 * These functions work on the input records and modify res.locals.* to setup the inserts and updates.
 *
 * res.locals.seen is a set of hash tables that does two jobs:
 *   1. it keeps track of what objects have already been "seen" and thus avoid duplicates
 *   2. it stores the "seen" objects for easy lookup when they need to be retrieved again
 *      (some of the tables in seen are just guards; those only store "true" for values)
 *
 * res.locals.inserts is a dictionary of object types to arrays of keys.
 *   * each key can access objects in res.locals.seen
 *   * some keys are built from multiple words, e.g. the course title and the section title,
 *     so the keys utility handles creating and parsing such keys.
 *
 * res.locals.updates function exactly like inserts, but for updates.
 */
import { Response } from "express";
import keys from "./keys";
import {
  Course,
  Project,
  ProjectBase,
  RosterInputHashTable,
  RosterInserts,
  RosterRecordInput,
  RosterUpdates,
  Section,
  User,
} from "./types";

export const processCourse = (
  res: Response,
  record: RosterRecordInput
): Course => {
  const { Course, Catalog } = record;
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  const updates: RosterUpdates = res.locals.updates;
  const courses: Course[] = res.locals.courses;
  if (!(Course in seen.course)) {
    const course = courses.find(({ title }) => title === Course) || {
      id: undefined,
      title: Course,
      catalogId: Catalog,
    };
    seen.course[Course] = course;
    // if no course, create it
    if (!course.id) inserts.courses.push(Course);
    // catalog should match course catalog, else update course
    else if (course.catalogId !== Catalog) updates.courses.push(Course);
  }
  return res.locals.seen.course[Course];
};

export const processSection = (
  res: Response,
  record: RosterRecordInput,
  course: Course
): Section => {
  const { Course, Section, Instructor } = record;
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  const updates: RosterUpdates = res.locals.updates;
  // this key ignores instructor, which we assume to be the same for all course sections
  const sectionKey = keys.section.make({
    courseTitle: Course,
    sectionTitle: Section,
  });
  if (!(sectionKey in seen.section)) {
    const sections: Section[] = res.locals.sections;
    const section = sections.find(
      ({ title, course }) => course.title === Course && title === Section
    ) || {
      id: undefined,
      title: Section,
      instructor: Instructor, //! will fail: needs to be a user ID
      course: {
        id: course?.id,
        title: Course,
      },
    };
    seen.section[sectionKey] = section;
    // if no section, create it
    if (!section.id) inserts.sections.push(sectionKey);
    // instructor should match section instructor, else update section
    else if (section.instructor !== Instructor)
      updates.sections.push(sectionKey);
  }
  return seen.section[sectionKey];
};

export const processUser = (res: Response, record: RosterRecordInput): void => {
  const { Student, NetID, Restriction } = record;
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  const updates: RosterUpdates = res.locals.updates;
  if (!(NetID in seen.user)) {
    // name is a comma separated string: "last, first"
    const [last = "", first = ""] = Student.trim().split(/\s*,\s*/);
    const users: User[] = res.locals.users;
    const user = users.find(({ username }) => username === NetID) || {
      id: undefined,
      username: NetID,
      name: {
        last,
        first,
        middle: "",
      },
      restriction: Number(Restriction),
    };
    seen.user[NetID] = user;
    // if user is not found, create new user
    if (!user.id) {
      inserts.users.push(NetID);
      // and give the user the "user" role
      inserts.roles.push(NetID);
      // and give the user a "walk-in" group
      inserts.walkInGroups.push(NetID);
    }
    // if name does not match or restriction does not match, update user
    else if (
      user.name.first !== first ||
      user.name.last !== last ||
      user.restriction !== Number(Restriction)
    )
      updates.users.push(NetID);
  }
};

export const processProject = (
  res: Response,
  record: RosterRecordInput,
  course: Course,
  section: Section
): void => {
  const { Project, Course, Section } = record;
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  const projects: ProjectBase[] = res.locals.projects;
  const projectKey = keys.sectionProject.make({
    projectTitle: Project,
    courseTitle: Course,
    sectionTitle: Section,
  });
  if (!(projectKey in seen.sectionProject)) {
    seen.sectionProject[projectKey] = true;
    if (!(Project in seen.project)) {
      const baseProject = projects.find(({ title }) => title === Project) || {
        id: undefined,
        title: Project,
        sectionIds: [] as number[],
      };
      const project: Project = {
        ...baseProject,
        course: { title: Course, id: course.id },
        section: { title: Section, id: section.id },
      };
      seen.project[Project] = project;
      if (!project.id) inserts.projects.push(Project);
    }
    const project = seen.project[Project];
    if (!(project.id && section.id && project.sectionIds.includes(section.id)))
      inserts.sectionProjects.push(projectKey);
  }
};

export const processRoster = (
  res: Response,
  record: RosterRecordInput
): void => {
  const { Course, Section, NetID } = record;
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  // create pending roster records if not already created
  // projects can span multiple sections, so Project not included in key
  const rosterKey = keys.roster.make({
    courseTitle: Course,
    sectionTitle: Section,
    netId: NetID,
  });
  if (!(rosterKey in seen.rosterRecord)) {
    const existing: RosterRecordInput[] = res.locals.rosterRecords;
    if (
      !existing.find(
        (r) => r.Course === Course && r.Section === Section && r.NetID === NetID
      )
    )
      inserts.rosterRecords.push(rosterKey);
    seen.rosterRecord[rosterKey] = true;
  }
};

/**
 * See ./processors for information on the res.locals.* objects.
 *
 * res.locals.unsafeMultiStatementPool
 *   * Using the unsafe multiple statement feature (see SQL injection for why it is unsafe)
 *   * Since this is an admin route and we would like to be able to insert many records at once,
 *     we are using the unsafe connection.
 *
 * Note that the query success callback function will update res.locals.seen.* with all the new IDs.
 * The is very important as subsequent middleware functions will be needing to use these IDs.
 */
import { Connection } from "mysql";
import keys from "./keys";
import {
  CourseRecord,
  ProjectRecord,
  ProjectSection,
  RosterInputHashTable,
  RosterInserts,
  SectionRecord,
  UserRecord,
} from "./types";
import { EC } from "../../utils/types";

export const insertCourses: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  if (!inserts.courses.length) return next();
  const courses: CourseRecord[] = inserts.courses.map((key) => {
    const course = seen.course[key];
    return { title: course.title, catalog_id: course.catalogId };
  });
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "INSERT INTO course SET ?;".repeat(courses.length),
    courses,
    (error, results) => {
      if (error) return next(error);
      inserts.courses.forEach(
        (key, i) => (seen.course[key].id = results[i].insertId)
      );
      next();
    }
  );
};

// this query requires all courses to be inserted first
export const insertSections: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  if (!inserts.sections.length) return next();
  const sections: SectionRecord[] = inserts.sections.map((key) => {
    const section = seen.section[key];
    const course = seen.course[section.course.title];
    if (!course.id)
      throw new Error("undefined course ID while inserting sections");
    return {
      title: section.title,
      instructor: section.instructor,
      course_id: course.id,
    };
  });
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "INSERT INTO section SET ?;".repeat(sections.length),
    sections,
    (error, results) => {
      if (error) return next(error);
      inserts.sections.forEach(
        (key, i) => (seen.section[key].id = results[i].insertId)
      );
      next();
    }
  );
};

export const insertProjects: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  if (!inserts.projects.length) return next();
  // since file contains no dates, we assume interval is current semester
  // similarly, just assume all projects are active and group details are 0
  const { start, end } = res.locals.semester;
  const projects: ProjectRecord[] = inserts.projects.map((key) => {
    const project = seen.project[key];
    return {
      title: project.title,
      start,
      end,
      book_start: start,
      group_hours: 0,
      group_size: 0,
      open: true,
    };
  });
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "INSERT INTO project SET ?;".repeat(projects.length),
    projects,
    (error, results) => {
      if (error) return next(error);
      inserts.projects.forEach(
        (key, i) => (seen.project[key].id = results[i].insertId)
      );
      next();
    }
  );
};

export const insertSectionProjects: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  if (!inserts.sectionProjects.length) return next();
  const projectSections: ProjectSection[] = inserts.sectionProjects.map(
    (key) => {
      const { courseTitle, sectionTitle, projectTitle } =
        keys.sectionProject.parse(key);
      const project = seen.project[projectTitle];
      if (!project.id)
        throw new Error(
          "undefined project ID when linking sections and projects"
        );
      const section =
        seen.section[keys.section.make({ courseTitle, sectionTitle })];
      if (!section.id)
        throw new Error(
          "undefined section ID when linking sections and projects"
        );
      return { project_id: project.id, section_id: section.id };
    }
  );
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "INSERT INTO section_project SET ?;".repeat(projectSections.length),
    projectSections,
    (error) => {
      if (error) return next(error);
      next();
    }
  );
};

export const insertUsers: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  if (!inserts.users.length) return next();
  const users: UserRecord[] = inserts.users.map((key) => {
    const user = seen.user[key];
    return {
      first_name: user.name.first,
      last_name: user.name.last,
      user_id: user.username,
      restriction: user.restriction,
    };
  });
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "INSERT INTO user SET ?;".repeat(users.length),
    users,
    (error, results) => {
      if (error) return next(error);
      inserts.users.forEach(
        (key, i) => (seen.user[key].id = results[i].insertId)
      );
      next();
    }
  );
};

type UserRoleRecord = { user_id: number; role_id: number };

export const insertUserRoles: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  if (!inserts.roles.length) return next();
  const userRoles: UserRoleRecord[] = inserts.roles.map((key) => {
    const user = seen.user[key];
    if (!user.id) throw new Error("undefined user ID while creating roles");
    return { user_id: user.id, role_id: res.locals.userRoleId };
  });
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "INSERT INTO user_role SET ?;".repeat(userRoles.length),
    userRoles,
    (error) => {
      if (error) return next(error);
      next();
    }
  );
};

type RosterRecordRecord = {
  user_id: number;
  course_id: number;
  section_id: number;
  semester_id: number;
};

export const insertRosterRecords: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  if (!inserts.rosterRecords.length) return next();
  const rosterRecords: RosterRecordRecord[] = inserts.rosterRecords.map(
    (key) => {
      const { courseTitle, sectionTitle, netId } = keys.roster.parse(key);
      const course = seen.course[courseTitle];
      const section =
        seen.section[keys.section.make({ courseTitle, sectionTitle })];
      const user = seen.user[netId];
      if (!course.id) throw new Error(`course: ${course.title} has no ID.`);
      if (!section.id)
        throw new Error(`section: ${course.title}-${section.title} has no ID.`);
      if (!user.id) throw new Error(`username: ${user.username} has no ID.`);
      return {
        user_id: user.id,
        course_id: course.id,
        section_id: section.id,
        semester_id: res.locals.semester.id,
      };
    }
  );
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "INSERT INTO roster SET ?;".repeat(rosterRecords.length),
    rosterRecords,
    (error) => {
      if (error) return next(error);
      next();
    }
  );
};

type ProjectGroupRecord = {
  title: string;
  project_id: number;
  creator_id: number;
  admin_approved_id: number;
  pending: boolean;
};

export const insertWalkIns: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const inserts: RosterInserts = res.locals.inserts;
  if (!inserts.walkInGroups.length) return next();
  const projectGroupRecords: ProjectGroupRecord[] = inserts.walkInGroups.map(
    (key) => {
      const user = seen.user[key];
      const name = [user.name.first, user.name.last].filter(String).join(" ");
      return {
        title: `${name} Walk-in`,
        project_id: 1, //! warning: using hardcoded walk-in project ID = 1
        creator_id: res.locals.user.id,
        admin_approved_id: res.locals.user.id,
        pending: false,
      };
    },
    [] as ProjectGroupRecord[]
  );
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "INSERT INTO project_group SET ?;".repeat(projectGroupRecords.length),
    projectGroupRecords,
    (error, results) => {
      if (error) return next(error);
      type ProjectGroupUserRecord = {
        user_id: number;
        project_group_id: number;
        invitation_accepted: boolean;
      };
      const projectGroupUsers: ProjectGroupUserRecord[] =
        inserts.walkInGroups.map((key, i) => {
          const user = seen.user[key];
          if (!user.id) throw new Error(`user: ${user.username} has no ID.`);
          return {
            user_id: user.id,
            project_group_id: results[i].insertId,
            invitation_accepted: true,
          };
        });
      (res.locals.unsafeMultiStatementPool as Connection).query(
        "INSERT INTO project_group_user SET ?;".repeat(
          projectGroupUsers.length
        ),
        projectGroupUsers,
        (error) => {
          if (error) return next(error);
          next();
        }
      );
    }
  );
};

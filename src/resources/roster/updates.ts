/**
 * See ./processors.ts and inserts.ts for information on all the res.locals.* objects.
 *
 * ! THESE ARE UNTESTED
 *
 * TODO: TEST
 *
 * Two things of note here:
 *   - The query pattern is "UPDATE table SET ? WHERE id = ?".
 *     This sets up the need to have arrays alternating like this: [{}, number, {}, number, ...]
 *     and such arrays will be twice as long in length as the number of updates needed.
 *   - Because we are keying off of strings (e.g. title of objects), we omit the key from the
 *     update. There is probably no harm in including the, but it is not necessary.
 */
import { Connection } from "mysql";
import {
  CourseRecord,
  RosterInputHashTable,
  RosterUpdates,
  SectionRecord,
  UserRecord,
} from "./types";
import { EC } from "../../utils/types";

export const updateCourses: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const updates: RosterUpdates = res.locals.updates;
  if (!updates.courses.length) return next();
  // need an alternating pattern of [CourseRecord, course.id, CourseRecord, course.id, ...]
  const courses: (Omit<CourseRecord, "title"> | number)[] =
    updates.courses.reduce((acc, key) => {
      const course = seen.course[key];
      acc.push({ catalog_id: course.catalogId });
      if (!course.id) throw new Error(`course: ${course.title} has no ID.`);
      acc.push(course.id);
      return acc;
    }, [] as (Omit<CourseRecord, "title"> | number)[]);
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "UPDATE course SET ? WHERE id = ?;".repeat(updates.courses.length),
    courses,
    (error) => {
      if (error) return next(error);
      next();
    }
  );
};

export const updateSections: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const updates: RosterUpdates = res.locals.updates;
  if (!updates.sections.length) return next();
  const sections: (Omit<SectionRecord, "title"> | number)[] =
    updates.sections.reduce((acc, key) => {
      const section = seen.section[key];
      if (!section.course.id)
        throw new Error(`section: ${section.title} has no course ID.`);
      acc.push({
        instructor: section.instructor,
        course_id: section.course.id,
      });
      if (!section.id) throw new Error(`section: ${section.title} has no ID.`);
      acc.push(section.id);
      return acc;
    }, [] as (Omit<SectionRecord, "title"> | number)[]);
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "UPDATE section SET ? WHERE id = ?;".repeat(updates.sections.length),
    sections,
    (error) => {
      if (error) return next(error);
      next();
    }
  );
};

export const updateUsers: EC = (_, res, next) => {
  const seen: RosterInputHashTable = res.locals.seen;
  const updates: RosterUpdates = res.locals.updates;
  if (!updates.users.length) return next();
  const users: (Omit<UserRecord, "user_id"> | number)[] = updates.users.reduce(
    (acc, key) => {
      const user = seen.user[key];
      if (!user.id) throw new Error(`user: ${user.username} has no ID.`);
      acc.push({
        first_name: user.name.first,
        last_name: user.name.last,
        restriction: user.restriction,
      });
      acc.push(user.id);
      return acc;
    },
    [] as (Omit<UserRecord, "user_id"> | number)[]
  );
  (res.locals.unsafeMultiStatementPool as Connection).query(
    "UPDATE user SET ? WHERE id = ?;".repeat(updates.users.length),
    users,
    (error) => {
      if (error) return next(error);
      next();
    }
  );
};

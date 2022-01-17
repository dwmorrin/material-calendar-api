import { getUnsafeMultipleStatementConnection } from "../../utils/db";
import { EC } from "../../utils/types";
import {
  crud,
  controllers,
  query as q,
  withResource,
  respond,
} from "../../utils/crud";

/**
 * @deprecated
 * TODO remove all references to this query
 * this is a SECTION query, not a course query
 */
export const query = `
  SELECT
    c.id,
    c.title,
    c.catalog_id AS catalogId,
    s.title AS section,
    s.instructor_id AS instructorId
  FROM
    course c
    INNER JOIN section s ON s.course_id = c.id
`;

const getMany = crud.readMany(`
  SELECT
    c.id,
    c.title,
    c.catalog_id AS catalogId
  FROM
    course c
`);

interface Course {
  id?: number;
  title: string;
  catalog_id: string;
}

const createMany: EC = (req, res, next) => {
  const connection = getUnsafeMultipleStatementConnection();
  const newCourses = req.body as {
    course: string;
    section: string;
    title: string;
  }[];
  if (!Array.isArray(newCourses) || !newCourses.length) {
    return next(new Error("No courses to create"));
  }
  const courses = res.locals.courses as Course[];
  // key off of the newCourse.course (the catalog_id)
  const inserts: Course[] = [];
  const updates: string[] = [];
  const seen: Set<string> = new Set();
  newCourses.forEach((newCourse) => {
    if (seen.has(newCourse.course)) return;
    seen.add(newCourse.course);
    const existing = courses.find(
      (course) => course.catalog_id === newCourse.course
    );
    if (existing) {
      if (existing.title !== newCourse.title) {
        updates.push(newCourse.title);
        updates.push(existing.catalog_id);
      }
    } else
      inserts.push({ title: newCourse.title, catalog_id: newCourse.course });
  });
  connection.beginTransaction((err) => {
    if (err) return next(err);
    connection.query(
      inserts.length
        ? "INSERT INTO course SET ?;".repeat(inserts.length)
        : "SELECT 1",
      inserts,
      (err) => {
        if (err) return next(err);
        connection.query(
          updates.length
            ? "UPDATE course SET title = ? WHERE catalog_id = ?;".repeat(
                updates.length
              )
            : "SELECT 1",
          updates,
          (err) => {
            if (err) return next(err);
            connection.commit((err) => {
              if (err) return next(err);
              connection.end();
              next();
            });
          }
        );
      }
    );
  });
};

const importCourses = [
  withResource("courses", "SELECT * FROM course"),
  createMany,
  respond({ status: 201, data: () => "ok" }),
];

export default {
  ...controllers("course", "id"),
  createOne: crud.createOne("INSERT INTO course SET ?", (req) => ({
    title: req.body.title,
    catalog_id: req.body.catalogId,
  })),
  getMany,
  importCourses,
  updateOne: crud.updateOne("UPDATE course SET ? WHERE id = ?", (req) => [
    { title: req.body.title, catalog_id: req.body.catalogId },
    req.params.id,
  ]),
};

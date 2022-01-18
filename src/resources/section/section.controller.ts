import pool, { getUnsafeMultipleStatementConnection } from "../../utils/db";
import { addResultsToResponse, respond, withResource } from "../../utils/crud";
import { EC } from "../../utils/types";

const getOne: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM section_view WHERE section_id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

const getMany: EC = (_, res, next) =>
  pool.query("SELECT * FROM section_view", addResultsToResponse(res, next));

//! temporary while refactoring. have client send instructor ID, not name
const updateOne: EC = (req, res, next) => {
  pool.query(
    "SELECT id FROM user WHERE first_name = ? AND last_name = ?",
    req.body.instructor.split(" "),
    (err, results) => {
      if (err) return next(err);
      if (results.length !== 1) return next(new Error("Instructor not found"));
      const { courseId, title } = req.body;
      pool.query(
        "UPDATE section SET ? WHERE id = ?",
        [
          {
            course_id: courseId,
            instructor_id: results[0].id,
            title,
          },
          req.params.id,
        ],
        addResultsToResponse(res, next, { one: true })
      );
    }
  );
};

const deleteOne: EC = (req, res, next) => {
  pool.query(
    "DELETE FROM section WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );
};

interface Course {
  id: number;
  title: string;
  catalog_id: string;
}

interface Section {
  id?: number;
  course_id: number;
  title: string;
  instructor_id: number;
}

interface User {
  id: number;
  user_id: string;
}

interface ImportRecord {
  username: string; // convert to user_id then to id
  course: string; // catalog_id
  section: string; // title
}

const createMany: EC = (req, res, next) => {
  const newSections: ImportRecord[] = req.body;
  if (!Array.isArray(newSections)) return next(new Error("Invalid body"));
  const courses: Course[] = res.locals.courses;
  if (!Array.isArray(courses)) return next(new Error("No existing courses"));
  const users: User[] = res.locals.users;
  if (!Array.isArray(users)) return next(new Error("No existing users"));
  const sections: Section[] = res.locals.sections;

  const inserts: Section[] = [];
  const updates: number[] = [];
  const seen: Set<string> = new Set();
  try {
    newSections.forEach((newSection) => {
      const key = newSection.course + newSection.section + newSection.username;
      if (seen.has(key)) return;
      seen.add(key);
      const course = courses.find((c) => c.catalog_id === newSection.course);
      if (!course) throw new Error("Course not found");
      const user = users.find((u) => u.user_id === newSection.username);
      if (!user) throw new Error("User not found");
      const existing = sections.find(
        (s) =>
          s.course_id === course.id &&
          String(s.title) === String(newSection.section)
      );
      if (existing?.id) {
        if (existing.instructor_id !== user.id) {
          updates.push(user.id);
          updates.push(existing.id);
        } // else no update necessary
      } else
        inserts.push({
          course_id: course.id,
          instructor_id: user.id,
          title: newSection.section,
        });
    });
  } catch (err) {
    return next(err);
  }

  const connection = getUnsafeMultipleStatementConnection();
  connection.beginTransaction((err) => {
    if (err) return next(err);
    connection.query(
      inserts.length
        ? "INSERT INTO section SET ?;".repeat(inserts.length)
        : "SELECT 1",
      inserts,
      (err) => {
        if (err) return next(err);
        connection.query(
          updates.length
            ? "UPDATE section SET instructor_id = ? WHERE id = ?"
            : "SELECT 1",
          updates,
          (err) => {
            if (err) return next(err);
            connection.commit((err) => {
              if (err) return next(err);
              next();
            });
          }
        );
      }
    );
  });
};

const importSections = [
  withResource("courses", "SELECT * FROM course"),
  withResource("users", "SELECT * FROM user"),
  withResource("sections", "SELECT * FROM section"),
  createMany,
  withResource("sections", "SELECT * FROM section_view"),
  respond({
    status: 201,
    data: (_, res) => res.locals.sections,
  }),
];

//! temporary while refactoring. have client send instructor ID, not name
const createOne: EC = (req, res, next) => {
  pool.query(
    "SELECT id FROM user WHERE first_name = ? AND last_name = ?",
    req.body.instructor.split(" "),
    (err, results) => {
      if (err) return next(err);
      if (results.length !== 1) return next(new Error("Instructor not found"));
      const { courseId, title } = req.body;
      pool.query(
        "INSERT INTO section SET ?",
        { courseId, instructor_id: results[0].id, title },
        addResultsToResponse(res, next, { one: true })
      );
    }
  );
};

export default {
  createOne,
  getOne,
  importSections,
  getMany,
  deleteOne,
  updateOne,
};

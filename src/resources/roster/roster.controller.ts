import { Connection } from "mysql";
import { EC, EEH } from "../../utils/types";
import { getUnsafeMultipleStatementConnection } from "../../utils/db";
import { crud, query, respond, withResource } from "../../utils/crud";
import withActiveSemester from "../../utils/withActiveSemester";

const getMany = crud.readMany("SELECT * FROM roster_view");

const getCourseId = query({
  sql: "SELECT id FROM course WHERE title = ? AND catalog_id = ?",
  using: (req) => [req.body.course.title, req.body.course.catalogId],
  then: (results, req, res) => {
    if (!results.length || !results[0].id)
      throw new Error(
        `No course for title "${req.body.course.title}" and catalog ID "${req.body.course.catalogId}"`
      );
    res.locals.courseId = results[0].id;
  },
});

const getSectionId = query({
  sql: "SELECT id FROM section WHERE course_id = ? and title = ?",
  using: (req, res) => [res.locals.courseId, req.body.course.section],
  then: (results, req, res) => {
    if (!results.length || !results[0].id)
      throw new Error(
        `No section for course ID "${res.locals.courseId}" and section title "${req.body.course.section}"`
      );
    res.locals.sectionId = results[0].id;
  },
});

const withActiveSemesterAndSections = [
  withActiveSemester,
  getCourseId,
  getSectionId,
];

const updateOne = crud.updateOne(
  "UPDATE roster SET ? WHERE id = ?",
  (req, res) => [
    {
      user_id: req.body.student.id,
      course_id: res.locals.courseId,
      section_id: res.locals.sectionId,
    },
    req.body.id,
  ]
);

const createOne = crud.createOne("INSERT INTO roster SET ?", (req, res) => [
  {
    user_id: req.body.student.id,
    course_id: res.locals.courseId,
    section_id: res.locals.sectionId,
  },
]);

const deleteOne = crud.deleteOne(
  "DELETE FROM roster WHERE id = ?",
  (req) => req.params.id
);

interface RosterInput {
  username: string; // db: user.user_id
  course: string; // db: course.catalog_id
  section: string; // db: section.title
}

function isRosterInput(x: RosterInput): x is RosterInput {
  return (
    !!x &&
    typeof x === "object" &&
    "username" in x &&
    "course" in x &&
    "section" in x
  );
}

// db course
interface Course {
  id: number;
  title: string;
  catalog_id: string;
}

// db section
interface Section {
  id: number;
  course_id: number;
  title: string;
  semester_id: number;
}

interface RosterInsert {
  user_id: number;
  section_id: number;
}

interface User {
  id: number;
  user_id: string;
}

const createMany: EC = (req, res, next) => {
  const inputs: RosterInput[] = req.body;
  if (!Array.isArray(inputs))
    return next("Expected an array of inputs - not an array");
  if (!inputs.every(isRosterInput))
    return next("Expected an array of inputs - invalid data");
  const semester: { id: number; start: string; end: string } =
    res.locals.semester;
  if (!semester) return next("No active semester - internal error");
  const courses: Course[] = res.locals.courses;
  if (!Array.isArray(courses)) return next("No courses - internal error");
  const sections: Section[] = res.locals.sections;
  if (!Array.isArray(sections)) return next("No sections - internal error");
  const users: User[] = res.locals.users;
  if (!Array.isArray(users)) return next("No users - internal error");

  let inserts: RosterInsert[] = [];
  try {
    inserts = inputs.map(
      ({ username, course: catalogId, section: sectionTitle }) => {
        const user = users.find((u) => u.user_id === username);
        if (!user) throw `No existing user with username "${username}"`;
        const course: Course | undefined = courses.find(
          (c) => c.catalog_id === catalogId
        );
        if (!course) throw `No existing course with catalog ID "${catalogId}"`;
        const section = sections.find(
          (s) =>
            s.semester_id === semester.id &&
            s.course_id === course.id &&
            String(s.title) === sectionTitle
        );
        if (!section)
          throw `No existing section with for "${catalogId}.${sectionTitle}"`;
        return {
          user_id: user.id,
          section_id: section.id,
        };
      }
    );
  } catch (e) {
    return next(e);
  }

  if (!inserts.length) return next("No inserts - internal error");

  const connection = getUnsafeMultipleStatementConnection();
  res.locals.connection = connection;
  connection.beginTransaction((err) => {
    if (err) return next(err);
    connection.query(
      "INSERT INTO roster SET ?;".repeat(inserts.length),
      inserts,
      (err) => {
        if (err) return next(err);
        connection.commit((err) => {
          if (err) return next(err);
          next();
        });
      }
    );
  });
};

const rollback: (label: string) => EEH = (label) => (error, _, res, next) => {
  const connection: Connection = res.locals.connection;
  if (!connection) return next(error);
  console.log("calling rollback: " + label);
  connection.rollback(() => next(error));
};

const importRoster = [
  withActiveSemester,
  withResource("courses", "SELECT * FROM course"),
  withResource("sections", "SELECT * FROM section"),
  withResource("users", "SELECT * FROM user"),
  withResource("rosterRecords", "SELECT * FROM roster"),
  createMany,
  rollback("Error creating roster records."),
  withResource("rosterRecords", "SELECT * FROM roster_view"),
  // might be more to update... tbd
  respond({
    status: 201,
    data: (_, res) => res.locals.rosterRecords,
  }),
];

export default {
  createOne: [...withActiveSemesterAndSections, ...createOne],
  deleteOne,
  getMany,
  importRoster,
  updateOne: [...withActiveSemesterAndSections, ...updateOne],
};

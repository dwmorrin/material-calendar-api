import pool from "../../utils/db";
import { addResultsToResponse, query } from "../../utils/crud";
import { EC } from "../../utils/types";
import withActiveSemester from "../../utils/withActiveSemester";

const getMany: EC = (_, res, next) =>
  pool.query("SELECT * FROM roster_view", addResultsToResponse(res, next));

interface RosterRecord {
  id: number;
  course: {
    id: number;
    title: string;
    catalogId: string;
    section: string;
    instructor: string;
  };
  student: {
    name: {
      first: string;
      last: string;
    };
    id: number;
    username: string;
  };
}

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

// requires semester and sectionId to be in res.locals
const updateOne: EC = (req, res, next) => {
  const record = req.body as RosterRecord;
  pool.query(
    "UPDATE roster SET ? WHERE id = ?",
    [
      {
        user_id: record.student.id,
        course_id: res.locals.courseId,
        semester_id: res.locals.semester.id,
        section_id: res.locals.sectionId,
      },
      record.id,
    ],
    addResultsToResponse(res, next, { one: true })
  );
};

const createOne: EC = (req, res, next) => {
  const record = req.body as RosterRecord;
  pool.query(
    "INSERT INTO roster SET ?",
    [
      {
        user_id: record.student.id,
        course_id: record.course.id,
        semester_id: res.locals.semester.id,
        section_id: res.locals.sectionId,
      },
    ],
    addResultsToResponse(res, next)
  );
};

export default {
  getMany,
  createOne: [...withActiveSemesterAndSections, createOne],
  updateOne: [...withActiveSemesterAndSections, updateOne],
};

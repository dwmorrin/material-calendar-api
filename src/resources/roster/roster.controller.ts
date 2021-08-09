import pool from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import query from "./roster.query";
import { EC } from "../../utils/types";
import withActiveSemester from "../../utils/withActiveSemester";

const getMany: EC = (_, res, next) =>
  pool.query(query, addResultsToResponse(res, next));

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

const getSectionByCourseIdAndTitle: EC = (req, res, next) => {
  const record = req.body as RosterRecord;
  pool.query(
    "SELECT id FROM section WHERE course_id = ? and title = ?",
    [record.course.id, record.course.section],
    (err, result) => {
      if (err) return next(err);
      const id = result[0].id;
      res.locals.sectionId = id;
      next();
    }
  );
};

const withActiveSemesterAndSections = [
  withActiveSemester,
  getSectionByCourseIdAndTitle,
];

// requires semester and sectionId to be in res.locals
const updateOne: EC = (req, res, next) => {
  const record = req.body as RosterRecord;
  pool.query(
    "UPDATE roster SET ? WHERE id = ?",
    [
      {
        user_id: record.student.id,
        course_id: record.course.id,
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

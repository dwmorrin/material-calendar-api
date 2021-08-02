import pool from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import { EC } from "../../utils/types";

const getOne: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM section_view WHERE section_id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

const getMany: EC = (_, res, next) =>
  pool.query("SELECT * FROM section_view", addResultsToResponse(res, next));

const updateOne: EC = (req, res, next) => {
  const { courseId, instructor, title } = req.body;
  pool.query(
    "UPDATE section SET ? WHERE id = ?",
    [
      {
        course_id: courseId,
        instructor,
        title,
      },
      req.params.id,
    ],
    addResultsToResponse(res, next, { one: true })
  );
};

const deleteOne: EC = (req, res, next) => {
  pool.query(
    "DELETE FROM section WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );
};

const createOne: EC = (req, res, next) => {
  const { courseId, instructor, title } = req.body;
  pool.query(
    "INSERT INTO section (course_id, instructor, title) VALUES (?, ?, ?)",
    [courseId, instructor, title],
    addResultsToResponse(res, next, { one: true })
  );
};

export default { createOne, getOne, getMany, deleteOne, updateOne };

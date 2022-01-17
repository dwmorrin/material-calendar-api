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

export default { createOne, getOne, getMany, deleteOne, updateOne };

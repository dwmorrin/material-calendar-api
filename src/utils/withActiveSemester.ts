import { EC } from "./types";
import pool from "./db";

const withActiveSemester: EC = (_, res, next) =>
  pool.query("SELECT * FROM active_semester_view", (error, results) => {
    if (error) return next(error);
    if (!results.length) return next(new Error("no active semester"));
    const { id, start, end } = results[0];
    res.locals.semester = { id, start, end };
    next();
  });

export default withActiveSemester;

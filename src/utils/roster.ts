import { Request, Response, Router } from "express";
import pool, { inflate } from "../utils/db";
import RosterRecord, { parseRoster } from "./RosterRecord";
import { onResult } from "../utils/crud";

const query = `
  SELECT
    json_object(
      'title', c.title,
      'instructor', c.instructor
    ) as course,
    json_object(
      'name', json_object('first', u.first_name, 'last', u.last_name),
      'id', u.id
    ) as student
  FROM
    roster r left join user u on r.student_id = u.id
    left join course c on r.course_id = c.id
`;

const getMany = (req: Request, res: Response) =>
  pool.query(query, onResult({ req, res, dataMapFn: inflate }).read);

const processRecord = (record: RosterRecord) => {
  // insert or update user record
  // pool.query("SELECT id, first_name, last_name FROM user WHERE user_id = ?", record.student.id, (err, rows) => {
  //   if (err) return errors.push(err);
  // })
};

const processRoster = (roster: RosterRecord[]) => {
  // loop through roster and process each line
};

const importFile = (req: Request, res: Response) => {
  try {
    const roster = parseRoster(req.body);
    res.status(201).json({ data: "success" });
  } catch (error) {
    res.status(400).json({ error: { code: 400, message: error.toString() } });
  }
};

const router = Router();

router.get("/", getMany);
router.post("/", importFile);

export default router;

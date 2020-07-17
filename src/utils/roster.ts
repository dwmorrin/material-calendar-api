import { Request, Response, Router } from "express";
import pool, { error500, inflate } from "../utils/db";
import RosterRecord, { parseRoster } from "./RosterRecord";
import { onResult } from "../utils/crud";

const getMany = (req: Request, res: Response) =>
  pool.query(
    "SELECT * FROM roster_current_view",
    onResult({ req, res, dataMapFn: inflate }).read
  );

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

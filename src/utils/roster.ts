import { Request, Response, Router } from "express";
import RosterRecord, { parseRoster } from "./RosterRecord";

const processRoster = (roster: RosterRecord[]) => {
  console.warn("TODO: implement updating database with roster file");
  console.log(roster);
};

const importFile = (req: Request, res: Response) => {
  try {
    const roster = parseRoster(req.body);
    processRoster(roster);
    res.status(201).json({ data: "success" });
  } catch (error) {
    res.status(400).json({ error: { code: 400, message: error.toString() } });
  }
};

const router = Router();

router.post("/", importFile);

export default router;

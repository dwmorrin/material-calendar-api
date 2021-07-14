import { Request, Response } from "express";
import pool, { inflate } from "../db";
import { onResult } from "../crud";
import query from "./roster.query";
import { Query } from "mysql";

const getMany = (req: Request, res: Response): Query =>
  pool.query(query, onResult({ req, res, dataMapFn: inflate }).read);

export default { getMany };

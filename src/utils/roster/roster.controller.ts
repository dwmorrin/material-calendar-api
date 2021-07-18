import pool from "../db";
import { addResultsToResponse } from "../crud";
import query from "./roster.query";
import { EC } from "../types";

const getMany: EC = (_, res, next) =>
  pool.query(query, addResultsToResponse(res, next));

export default { getMany };

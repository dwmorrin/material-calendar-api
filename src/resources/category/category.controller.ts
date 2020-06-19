import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";
import { controllers } from "../../utils/crud";

export default controllers("category", "id");

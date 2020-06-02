import { Request, Response } from "express";
import { controllers } from "../../utils/crud";

export const getGroups = (req: Request, res: Response) => {
  res
    .status(500)
    .json({ error: { code: 500, message: "TODO: make group controller" } });
};

export const getOneGroup = (req: Request, res: Response) => {
  res
    .status(500)
    .json({ error: { code: 500, message: "TODO: make group controller" } });
};

export default { ...controllers("user", "username"), getGroups, getOneGroup };

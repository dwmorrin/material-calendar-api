import { Request, Response } from "express";
import { controllers } from "../../utils/crud";

export const getMany = (req: Request, res: Response) => {
  res
    .status(500)
    .json({ error: { code: 500, message: "TODO get many location" } });
};

export default controllers("studio", "id");

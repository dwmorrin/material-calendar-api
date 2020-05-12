import { Request, Response } from "express";

export const logout = (req: Request, res: Response) => {
  req.session?.destroy(console.error);
  return res.clearCookie("connect.sid").send();
};

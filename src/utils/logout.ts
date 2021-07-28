import { Response, Request } from "express";

const logout = (req: Request | { session: null }, res: Response): void => {
  req.session = null;
  res.status(201).json({ data: "Logged out" });
};

export default logout;

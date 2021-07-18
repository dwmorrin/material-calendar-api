import { NextFunction, Request, Response } from "express";

/** ExpressCallback */
export type EC = (req: Request, res: Response, next: NextFunction) => void;

/** ExpressErrorHandler */
export type EEH = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => void;

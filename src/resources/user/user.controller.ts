import { User } from "./user.model";
import { Request, Response } from "express";
import { controllers } from "../../utils/crud";

export const getGroups = (req: Request, res: Response) => {
  const { context } = req.query;
  // TODO do a graph lookup of relationships
  console.warn(`${req.url} not implemented yet`);
  res.status(200).json({ data: [], context });
};

export const getMany = (req: Request, res: Response) => {
  const { context } = req.query;
  User.find()
    .lean()
    .select(
      "-__v -createdAt -updatedAt -relations.updatedAt -relations.createdAt"
    )
    // .populate("projects")
    .then((data) => res.status(200).json({ data, context }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const getOne = (req: Request, res: Response) => {
  User.findOne({ _id: req.params.id })
    .lean()
    .populate("projects")
    // leaving relations.project as just an ID
    .populate("relations.requested")
    .populate("relations.accepted")
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export default { ...controllers(User), getGroups, getMany, getOne };

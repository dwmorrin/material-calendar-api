import { Project } from "./project.model";
import { Request, Response } from "express";
import { controllers } from "../../utils/crud";

export const getGroups = (req: Request, res: Response) => {
  const { context } = req.query;
  Project.aggregate([
    {
      $group: {
        _id: "$group.title",
        projects: { $push: "$$ROOT" },
      },
    },
  ])
    .then((data) => {
      res.status(200).json({ data, context });
    })
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const getOne = (req: Request, res: Response) => {
  Project.findOne({ _id: req.params.id })
    .lean()
    .populate("locations")
    .populate("managers")
    .populate("members")
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export default { ...controllers(Project), getGroups, getOne };

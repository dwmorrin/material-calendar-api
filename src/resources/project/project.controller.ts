import { Project } from "./project.model";
import { Request, Response } from "express";

export const createOne = (req: Request, res: Response) => {
  Project.create(req.body)
    .then((data) => res.status(201).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

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

export const getMany = (req: Request, res: Response) => {
  const { context } = req.query;
  Project.find()
    .lean()
    .then((data) => res.status(200).json({ data, context }))
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

export const removeOne = (req: Request, res: Response) => {
  Project.findOneAndRemove({ _id: req.params.id })
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const updateOne = (req: Request, res: Response) => {
  Project.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
  })
    .lean()
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.log(error);
      res.status(400).end();
    });
};

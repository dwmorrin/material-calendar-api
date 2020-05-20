import { Equipment } from "./equipment.model";
import { Request, Response } from "express";

export const createOne = (req: Request, res: Response) => {
  Equipment.create(req.body)
    .then((data) => res.status(201).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const getMany = (req: Request, res: Response) => {
  const { context } = req.query;
  Equipment.find()
    .lean()
    .select(
      "-__v -createdAt -updatedAt -relations.updatedAt -relations.createdAt"
    )
    .then((data) => res.status(200).json({ data, context }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const getOne = (req: Request, res: Response) => {
  Equipment.findOne({ _id: req.params.id })
    .lean()
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const removeOne = (req: Request, res: Response) => {
  Equipment.findOneAndRemove({ _id: req.params.id })
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const updateOne = (req: Request, res: Response) => {
  Equipment.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
  })
    .lean()
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.log(error);
      res.status(400).end();
    });
};

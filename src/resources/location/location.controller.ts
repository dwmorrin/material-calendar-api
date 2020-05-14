import { Resource as Location } from "./location.model";
import { Request, Response } from "express";

export const createOne = (req: Request, res: Response) => {
  Location.create(req.body)
    .then((data) => res.status(201).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const getMany = (_: Request, res: Response) => {
  Location.find()
    .lean()
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const getOne = (req: Request, res: Response) => {
  Location.findOne({ _id: req.params.id })
    .lean()
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const removeOne = (req: Request, res: Response) => {
  Location.findOneAndRemove({ _id: req.params.id })
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

export const updateOne = (req: Request, res: Response) => {
  Location.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
  })
    .lean()
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.log(error);
      res.status(400).end();
    });
};

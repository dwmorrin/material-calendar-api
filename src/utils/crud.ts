import { Request, Response } from "express";
import { Document, Model } from "mongoose";

export const createOne = (model: Model<Document>) => (
  req: Request,
  res: Response
) =>
  model
    .create(req.body)
    .then((data) => res.status(201).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });

export const getMany = (model: Model<Document>) => (
  req: Request,
  res: Response
) =>
  model
    .find()
    .lean()
    .then((data) => res.status(200).json({ data, context: req.query.context }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });

export const getOne = (model: Model<Document>) => (
  req: Request,
  res: Response
) =>
  model
    .findOne({ _id: req.params.id })
    .lean()
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });

export const removeOne = (model: Model<Document>) => (
  req: Request,
  res: Response
) =>
  model
    .findOneAndRemove({ _id: req.params.id })
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });

export const updateOne = (model: Model<Document>) => (
  req: Request,
  res: Response
) => {
  model
    .findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true,
    })
    .lean()
    .then((data) => res.status(200).json({ data }))
    .catch((error) => {
      console.log(error);
      res.status(400).end();
    });
};

export const controllers = (model: Model<Document>) => ({
  createOne: createOne(model),
  getMany: getMany(model),
  getOne: getOne(model),
  removeOne: removeOne(model),
  updateOne: updateOne(model),
});

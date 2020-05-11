import { Resource as Location } from "./resource.model";
import { Request, Response } from "express";

export const createOne = () => async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ data: location });
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
};

export const getMany = () => async (
  _: Request,
  res: Response
): Promise<void> => {
  try {
    const locations = await Location.find().lean().exec();
    res.status(200).json({ data: locations });
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
};

export const getOne = () => async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const location = await Location.findOne({ _id: req.params.id })
      .lean()
      .exec();

    if (!location) {
      return res.status(400).end();
    }
    res.status(200).json({ data: location });
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
};

export const removeOne = () => async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const location = await Location.findOneAndRemove({ _id: req.params.id });

    if (!location) {
      return res.status(400).end();
    }
    res.status(200).json({ data: location });
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
};

export const updateOne = () => async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const location = await Location.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true,
      }
    )
      .lean()
      .exec();

    if (!location) {
      return res.status(400).end();
    }
    res.status(200).json({ data: location });
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
};

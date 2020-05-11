import { Event } from "./event.model";
import { Request, Response } from "express";

export const createOne = () => async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ data: event });
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
    const events = await Event.find().lean().exec();
    res.status(200).json({ data: events });
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
    const event = await Event.findOne({ _id: req.params.id }).lean().exec();

    if (!event) {
      return res.status(400).end();
    }
    res.status(200).json({ data: event });
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
    const event = await Event.findOneAndRemove({ _id: req.params.id });

    if (!event) {
      return res.status(400).end();
    }
    res.status(200).json({ data: event });
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
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true,
      }
    )
      .lean()
      .exec();

    if (!event) {
      return res.status(400).end();
    }
    res.status(200).json({ data: event });
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
};

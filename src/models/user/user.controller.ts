import { User } from "./user.model";
import { Request, Response } from "express";

export const createOne = () => async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ data: user });
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
    const users = await User.find().lean().exec();
    res.status(200).json({ data: users });
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
    const user = await User.findOne({ _id: req.params.id }).lean().exec();

    if (!user) {
      return res.status(400).end();
    }
    res.status(200).json({ data: user });
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
    const user = await User.findOneAndRemove({ _id: req.params.id });

    if (!user) {
      return res.status(400).end();
    }
    res.status(200).json({ data: user });
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
    const user = await User.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true,
    })
      .lean()
      .exec();

    if (!user) {
      return res.status(400).end();
    }
    res.status(200).json({ data: user });
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
};

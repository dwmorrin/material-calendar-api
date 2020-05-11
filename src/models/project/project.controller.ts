import { Project } from "./project.model";
import { Request, Response } from "express";

export const createOne = () => async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ data: project });
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
    const projects = await Project.find().lean().exec();
    res.status(200).json({ data: projects });
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
    const project = await Project.findOne({ _id: req.params.id }).lean().exec();

    if (!project) {
      return res.status(400).end();
    }
    res.status(200).json({ data: project });
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
    const project = await Project.findOneAndRemove({ _id: req.params.id });

    if (!project) {
      return res.status(400).end();
    }
    res.status(200).json({ data: project });
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
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true,
      }
    )
      .lean()
      .exec();

    if (!project) {
      return res.status(400).end();
    }
    res.status(200).json({ data: project });
  } catch (error) {
    console.error(error);
    res.status(400).end();
  }
};

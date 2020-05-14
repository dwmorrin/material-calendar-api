import { Request, Response } from "express";
import { User } from "../resources/user/user.model";

export const login = (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).end();
  }
  User.findOne({ username })
    .lean()
    .select(
      "-__v -createdAt -updatedAt -relations.updatedAt -relations.createdAt"
    )
    .then((data) => {
      if (!data) {
        return res.status(401).end();
      }
      // user data OK; try to start session
      if (!req.session) {
        return res.status(500).json({
          error: {
            code: 500,
            message: "could not start session, try back later",
          },
        });
      }
      req.session.userId = data._id;
      // session OK; return user info to client
      res.status(201).json({ data });
    })
    .catch((error) => {
      console.error(error);
      res.status(400).end();
    });
};

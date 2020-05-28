import { Request, Response } from "express";
import connection, { error500 } from "../../utils/db";
import { controllers } from "../../utils/crud";

export const getMany = (req: Request, res: Response) => {
  connection.query(
    `
      SELECT 
        id
        name as title,
        location as groupId,
        eventColor
      FROM
        studio
    `,
    (err, rows) => {
      if (err) return res.status(500).json(error500(err));
      res.status(200).json({ data: rows, context: req.query.context });
    }
  );
};

export default controllers("studio", "id");

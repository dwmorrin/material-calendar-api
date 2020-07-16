import { controllers } from "../../utils/crud";
import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";

const query = `
  SELECT
    id,
    purpose AS description,
    allotment_id AS eventId,
    group_id AS groupId,
    project_id AS projectId,
    guests,
    IF(
      cancel_request = 1,
      JSON_OBJECT(
        'requested', JSON_OBJECT(
          'on', cancel_request_time,
          'by', cancel_request_userid,
          'comment', cancel_request_comment
      ),
        'approved', JSON_OBJECT(
          'on', cancelled_time,
          'by', cancelled_approval
      ),
        'rejected', NULL
      ),
      NULL
    ) AS cancellation
  FROM
    booking
`;

export const getOne = (req: Request, res: Response) => {
  pool.query(query + "WHERE id = ?", [req.params.id], (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: inflate(rows[0]), context });
  });
};

export const getMany = (req: Request, res: Response) => {
  pool.query(query, (err, rows) => {
    const { context } = req.query;
    if (err) return res.status(500).json(error500(err, context));
    res.status(200).json({ data: rows.map(inflate), context });
  });
};

export default {
  ...controllers("booking", "id"),
  getOne,
  getMany,
};

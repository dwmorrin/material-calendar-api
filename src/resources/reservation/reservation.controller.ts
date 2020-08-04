import { controllers, onResult } from "../../utils/crud";
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

const flattenEquipment = (bookingId: number) => (equipment: {
  id: number;
  quantity: number;
}): (string | number | boolean)[] => [
  equipment.id,
  bookingId,
  equipment.quantity,
];

const insertManyQuery = `
  REPLACE INTO equipment_reservation
    (equipment_id, booking_id, quantity)
  VALUES ?
`;

const reserveEquipment = (req: Request, res: Response) => {
  pool.query(
    insertManyQuery,
    [req.body.map(flattenEquipment(+req.params.id))],
    (err) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      res.status(201).json({
        data: { ...req.body },
        context,
      });
    }
  );
};

export const getOne = (req: Request, res: Response) =>
  pool.query(
    query + "WHERE id = ?",
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );

export const getMany = (req: Request, res: Response) =>
  pool.query(query, onResult({ req, res, dataMapFn: inflate }).read);

export default {
  ...controllers("booking", "id"),
  getOne,
  getMany,
  reserveEquipment,
};

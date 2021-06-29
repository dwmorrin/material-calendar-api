import { controllers, onResult } from "../../utils/crud";
import { Request, Response } from "express";
import pool, { error500, inflate } from "../../utils/db";
import { Query } from "mysql";

const query = `
  SELECT
    id,
    purpose AS description,
    allotment_id AS eventId,
    group_id AS groupId,
    IFNULL (0, project_id) AS projectId,
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

const flattenEquipment =
  (bookingId: number) =>
  (equipment: {
    id: number;
    quantity: number;
  }): (string | number | boolean)[] =>
    [equipment.id, bookingId, equipment.quantity];

const insertManyQuery = `
  REPLACE INTO equipment_reservation
    (equipment_id, booking_id, quantity)
  VALUES ?
`;

const reserveEquipment = (req: Request, res: Response): Query =>
  pool.query(
    insertManyQuery,
    [req.body.map(flattenEquipment(+req.params.id))],
    (err) => {
      const { context } = req.query;
      if (err) return res.status(500).json(error500(err, context));
      // Remove any quantities that have been set to 0 (simpler implementation than doing a delete where equipment_id + reservation_id match the zeroed item)
      pool.query(" DELETE FROM equipment_reservation where quantity=0", () =>
        res.status(201).json({
          data: { ...req.body },
          context,
        })
      );
    }
  );

export const getOne = (req: Request, res: Response): Query =>
  pool.query(
    query + "WHERE id = ?",
    [req.params.id],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );

export const getMany = (req: Request, res: Response): Query =>
  pool.query(query, onResult({ req, res, dataMapFn: inflate }).read);

export const createOne = (req: Request, res: Response): Query =>
  pool.query(
    "INSERT INTO booking SET ?",
    [
      {
        allotment_id: req.body.allotmentId,
        group_id: req.body.groupId,
        purpose: req.body.description,
        guests: req.body.guests,
        living_room: req.body.liveRoom,
        contact_phone: req.body.phone,
        notes: req.body.notes,
      },
    ],
    onResult({ req, res, dataMapFn: inflate }).create
  );

export const updateOne = (req: Request, res: Response): Query =>
  pool.query(
    "UPDATE booking SET ? WHERE id = ?",
    [
      {
        allotment_id: req.body.allotmentId,
        group_id: req.body.groupId,
        purpose: req.body.description,
        guests: req.body.guests,
        living_room: req.body.liveRoom,
        contact_phone: req.body.phone,
        notes: req.body.notes,
      },
      Number(req.params.id),
    ],
    onResult({ req, res }).update
  );

export default {
  ...controllers("booking", "id"),
  createOne,
  updateOne,
  getOne,
  getMany,
  reserveEquipment,
};

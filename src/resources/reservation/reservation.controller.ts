import { addResultsToResponse, controllers } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

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

const reserveEquipment: EC = (req, res, next) =>
  pool.query(
    insertManyQuery,
    [req.body.map(flattenEquipment(+req.params.id))],
    addResultsToResponse(res, next)
  );

const deleteEquipmentReservationZeros: EC = (_, res, next) =>
  pool.query(
    " DELETE FROM equipment_reservation where quantity=0",
    addResultsToResponse(res, next)
  );

export const getOne: EC = (req, res, next) =>
  pool.query(
    query + "WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

export const getMany: EC = (_, res, next) =>
  pool.query(query, addResultsToResponse(res, next));

export const createOne: EC = (req, res, next) =>
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
    addResultsToResponse(res, next)
  );

export const updateOne: EC = (req, res, next) =>
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
    addResultsToResponse(res, next)
  );

export default {
  ...controllers("booking", "id"),
  createOne,
  updateOne,
  getOne,
  getMany,
  reserveEquipment: [reserveEquipment, deleteEquipmentReservationZeros],
};

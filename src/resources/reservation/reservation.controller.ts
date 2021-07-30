import { addResultsToResponse, controllers } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

interface Equipment {
  id: number;
  quantity: number;
}

const reserveEquipment: EC = (req, res, next) => {
  const bookingId = Number(req.params.id);
  const equipment = req.body as Equipment[];
  pool.query(
    `REPLACE INTO equipment_reservation (
      equipment_id, booking_id, quantity
    ) VALUES ?`,
    [equipment.map(({ id, quantity }) => [id, bookingId, quantity])],
    addResultsToResponse(res, next)
  );
};

const deleteEquipmentReservationZeros: EC = (_, res, next) =>
  pool.query(
    "DELETE FROM equipment_reservation WHERE quantity = 0",
    addResultsToResponse(res, next)
  );

export const getOne: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM reservation WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );

export const cancelReservation: EC = (req, res, next) => {
  pool.query(
    `UPDATE booking
    SET
      cancelled = 1,
      cancelled_time = CURRENT_TIMESTAMP,
      cancelled_user_id = ?,
      refund_request = ?,
      refund_request_comment = ?, 
      refund_approval_id = ?,
      refund_response_time = ? 
    WHERE id = ?`,
    [
      req.body.userId,
      req.body.refundApproved ? 1 : req.body.refundRequest ? 1 : 0,
      req.body.refundApproved
        ? "Refund Granted Automatically"
        : req.body.refundComment,
      req.body.refundApproved ? req.body.userId : null,
      req.body.refundApproved ? new Date() : null,
      req.params.reservationId,
    ],
    addResultsToResponse(res, next, { one: true })
  );
};

export const getMany: EC = (_, res, next) =>
  pool.query("SELECT * FROM reservation", addResultsToResponse(res, next));

export const getManyPendingAdminApproval: EC = (_, res, next) =>
  pool.query(
    "SELECT * FROM reservation_pending",
    addResultsToResponse(res, next)
  );

export const adminResponse: EC = (req, res, next) => {
  const { approved, denied, adminId } = req.body;
  pool.query(
    "UPDATE booking SET ? WHERE id = ?",
    [
      {
        refund_approval_id: approved ? adminId : null,
        refund_denial_id: denied ? adminId : null,
      },
      req.params.reservationId,
    ],
    addResultsToResponse(res, next)
  );
};

export const createOne: EC = (req, res, next) =>
  pool.query(
    "INSERT INTO booking SET ?",
    [
      {
        allotment_id: req.body.allotmentId,
        group_id: req.body.groupId,
        purpose: req.body.description,
        guests: req.body.guests,
        live_room: req.body.liveRoom,
        contact_phone: req.body.phone,
        notes: req.body.notes,
        project_id: req.body.project,
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
        live_room: req.body.liveRoom,
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
  getManyPendingAdminApproval,
  adminResponse,
  cancelReservation,
  reserveEquipment: [reserveEquipment, deleteEquipmentReservationZeros],
};

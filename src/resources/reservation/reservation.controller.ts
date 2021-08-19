import { addResultsToResponse, crud, withResource } from "../../utils/crud";
import pool, { inflate } from "../../utils/db";
import { EC } from "../../utils/types";
import { useMailbox } from "../../utils/mailer";
import { Request } from "express";

interface Equipment {
  id: number;
  quantity: number;
}

const reserveEquipment: EC = (req, res, next) => {
  const bookingId = res.locals.reservation.insertId;
  const equipment = req.body.equipment as Equipment[];
  if (!Array.isArray(equipment))
    return next("reservation form without equipment");
  if (!equipment.length) return next();
  pool.query(
    `REPLACE INTO equipment_reservation (
      equipment_id, booking_id, quantity
    ) VALUES ?`,
    [equipment.map(({ id, quantity }) => [id, bookingId, quantity])],
    addResultsToResponse(res, next)
  );
};

const deleteEquipment: EC = (req, res, next) => {
  const bookingId = res.locals.reservation.insertId;
  const equipment = req.body.equipment as Equipment[];
  // assumes reserveEquipment has already been called and checked isArray
  if (!equipment.length)
    pool.query(
      `DELETE FROM equipment_reservation
    WHERE booking_id = ?`,
      bookingId,
      addResultsToResponse(res, next)
    );
  else
    pool.query(
      `DELETE FROM equipment_reservation
    WHERE booking_id = ? AND equipment_id NOT IN (?)`,
      [bookingId, equipment.map(({ id }) => id)],
      addResultsToResponse(res, next)
    );
};

const getUpdatedEvent: EC = (req, res, next) => {
  const id = req.body.eventId;
  pool.query(
    "SELECT * FROM event_view WHERE id = ?",
    id,
    addResultsToResponse(res, next, { key: "event" })
  );
};

const getUpdatedReservation: EC = (req, res, next) => {
  const bookingId = res.locals.reservation.insertId;
  pool.query(
    "SELECT * FROM reservation_view WHERE id = ?",
    bookingId,
    addResultsToResponse(res, next, { key: "reservation" })
  );
};

const editReservationResponse: EC = (req, res, next) => {
  // event reservation info has changed
  // reservation has changed
  res.status(201).json({
    data: {
      event: inflate(res.locals.event),
      reservation: inflate(res.locals.reservation),
    },
    context: req.query.context,
  });
  next();
};

const editReservationStack = [
  reserveEquipment,
  deleteEquipment,
  getUpdatedEvent,
  getUpdatedReservation,
  editReservationResponse,
  useMailbox,
];

const getOne = crud.readOne(
  "SELECT * FROM reservation_view WHERE id = ?",
  (req) => Number(req.params.id)
);

export const cancelReservation: EC = (req, res, next) => {
  const { mailbox } = req.body;
  // useMailbox requires res.locals.mailbox be an array
  res.locals.mailbox = Array.isArray(mailbox) ? mailbox : [];
  pool.query(
    `UPDATE booking
    SET
      canceled = 1,
      canceled_time = CURRENT_TIMESTAMP,
      canceled_user_id = ?,
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

const cancelResponse: EC = (_, res, next) => {
  res.status(201).json({
    data: {
      reservations: res.locals.reservations,
      events: res.locals.events,
    },
  });
  next();
};

const withUpdatedEventsAndReservations = [
  withResource("reservations", "SELECT * FROM reservation_view"),
  withResource("events", "SELECT * FROM event"),
];

const getMany = crud.readMany("SELECT * FROM reservation_view");

const byUserQuery = `SELECT
  res.*
FROM
  reservation_view res
  INNER JOIN project_group pg ON pg.id = res.groupId
  INNER JOIN project_group_user pgu ON pgu.project_group_id = pg.id
  INNER JOIN user u on u.id = pgu.user_id
WHERE u.id = ?`;

const getByUser: EC = (req, res, next) =>
  pool.query(byUserQuery, req.params.id, addResultsToResponse(res, next));

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

// .id is a url param and .equipment is dealt with separately
const getReservationFromBody = (req: Request) => ({
  event_id: req.body.eventId,
  contact_phone: req.body.phone,
  group_id: req.body.groupId,
  guests: req.body.guests,
  live_room: req.body.liveRoom,
  notes: req.body.notes,
  project_id: req.body.projectId,
  purpose: req.body.description,
});

export const createOne: EC = (req, res, next) =>
  pool.query(
    "INSERT INTO reservation SET ?",
    [getReservationFromBody(req)],
    addResultsToResponse(res, next, { key: "reservation" })
  );

export const updateOne: EC = (req, res, next) => {
  // a bit of a hack, but this makes for the same as createOne
  res.locals.reservation.insertId = req.params.id;
  pool.query(
    "UPDATE reservation SET ? WHERE id = ?",
    [getReservationFromBody(req), Number(req.params.id)],
    addResultsToResponse(res, next, { one: true, key: "ignore" })
  );
};

// TODO untested
const removeOne: EC = (req, res, next) => {
  pool.query(
    "DELETE FROM reservation WHERE id = ?",
    [req.params.id],
    addResultsToResponse(res, next, { one: true })
  );
};

export default {
  createOne: [createOne, ...editReservationStack],
  updateOne: [updateOne, ...editReservationStack],
  getOne,
  getByUser,
  getMany,
  getManyPendingAdminApproval,
  adminResponse,
  cancelReservation: [
    cancelReservation,
    ...withUpdatedEventsAndReservations,
    cancelResponse,
    useMailbox,
  ],
  removeOne,
};

import {
  addResultsToResponse,
  crud,
  query,
  respond,
  withResource,
} from "../../utils/crud";
import pool, { inflate } from "../../utils/db";
import { EC } from "../../utils/types";
import { useMailbox } from "../../utils/mailer";
import { Request } from "express";
import { makeUsedHoursQuery } from "../project/project.helpers";

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

const cancelReservation = query({
  sql: "UPDATE reservation SET = ? WHERE id = ?",
  using: (req, res) => [
    {
      canceled: true,
      canceled_time: new Date(),
      canceled_user_id: res.locals.user.id,
      refund_request: req.body.refundApproved || req.body.refundRequest,
      refund_request_comment: req.body.refundApproved
        ? "Refund Granted Automatically"
        : req.body.refundComment,
      refund_approval_id: req.body.refundApproved ? res.locals.user.id : null,
      refund_response_time: req.body.refundApproved ? new Date() : null,
    },
    req.params.id,
  ],
});

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

const getByUser = crud.readMany(byUserQuery, (_, res) => res.locals.user.id);

const refund = [
  query({
    sql: "UPDATE booking SET ? WHERE id = ?",
    using: (req, res) => [
      {
        refund_approval_id: req.body.approved ? res.locals.user.id : null,
        refund_denial_id: req.body.approved ? null : res.locals.user.id,
      },
      Number(req.params.id),
    ],
  }),
  query({
    sql: "SELECT * FROM reservation_view",
    then: (results, _, res) => (res.locals.reservations = results),
  }),
  respond({
    status: 201,
    data: (_, res) => ({ reservations: res.locals.reservations }),
    callNext: true,
  }),
  useMailbox,
];

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

const createOneStack = [
  // get corresponding virtual week from event ID
  query({
    sql: `
      SELECT vw.id, vw.start, vw.end
      FROM   event e
      JOIN   virtual_week vw USING (location_id)
      WHERE  e.id = ?
      AND    e.start BETWEEN vw.start AND vw.end
    `,
    using: (req) => req.body.eventId,
    then: (results, _, res) => (res.locals.virtualWeek = results[0]),
  }),
  // get used hours across project for the virtual week
  query({
    assert: (_, res) => {
      if (!res.locals.virtualWeek)
        throw [
          "Booking app is not setup for this event.", // friendly message
          "(Event is not part of a virtual week.)", // hint to admin/dev
        ].join(" ");
    },
    sql: makeUsedHoursQuery(),
    using: (req, res) => [
      req.body.projectId,
      req.body.locationId,
      res.locals.virtualWeek.start,
      res.locals.virtualWeek.end,
    ],
    then: (results, _, res) => (res.locals.usedHours = results[0].hours),
  }),
  // get project virtual week hours
  query({
    sql: `
    SELECT hours
    FROM   project_virtual_week_hours
    WHERE  project_id = ?
    AND    virtual_week_id = ?`,
    using: (req, res) => [req.body.projectId, res.locals.virtualWeek.id],
    then: (results, _, res) =>
      (res.locals.projectVirtualWeekHours = results[0].hours),
  }),
  // validate and create reservation
  query({
    assert: (_, res) => {
      const { usedHours, projectVirtualWeekHours } = res.locals;
      if (usedHours === undefined) throw "Cannot find used hours";
      if (projectVirtualWeekHours === undefined) throw "Cannot find used hours";
      if (usedHours >= projectVirtualWeekHours)
        throw "Project does not have enough hours";
    },
    sql: "INSERT INTO reservation SET ?",
    using: (req) => [getReservationFromBody(req)],
    insertThen: (results, _, res) => (res.locals.reservation = results),
  }),
];

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
  createOne: [...createOneStack, ...editReservationStack],
  updateOne: [updateOne, ...editReservationStack],
  getOne,
  getByUser,
  getMany,
  refund,
  cancelReservation: [
    cancelReservation,
    ...withUpdatedEventsAndReservations,
    cancelResponse,
    useMailbox,
  ],
  removeOne,
};

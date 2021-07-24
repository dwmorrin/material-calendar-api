import { addResultsToResponse, controllers } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

const query = `
  SELECT
    id,
    purpose AS description,
    allotment_id AS eventId,
    group_id AS groupId,
    IFNULL (project_id, 0) AS projectId,
    guests,
    IF(
      cancel_request = 1,
      JSON_OBJECT(
        'requested', JSON_OBJECT(
          'on', date_format(cancel_request_time,"%Y-%m-%d %T"),
          'by', cancel_request_userid,
          'comment', cancel_request_comment
      ),
        'approved', JSON_OBJECT(
          'on', date_format(cancelled_time,"%Y-%m-%d %T"),
          'by', cancelled_approval
      ),
        'rejected', NULL
      ),
      NULL
    ) AS cancellation
  FROM
    booking
`;

const adminRequestQuery = `
  SELECT
    b.id,
    b.purpose AS description,
    b.allotment_id AS eventId,
    b.group_id AS groupId,
    IFNULL (b.project_id, 0) AS projectId,
    b.guests,
    IF(
      b.cancel_request = 1,
      JSON_OBJECT(
        'requested', JSON_OBJECT(
          'on', date_format(b.cancel_request_time,"%Y-%m-%d %T"),
          'by', b.cancel_request_userid,
          'comment', b.cancel_request_comment
      ),
        'approved', JSON_OBJECT(
          'on', date_format(b.cancelled_time,"%Y-%m-%d %T"),
          'by', b.cancelled_approval
      ),
        'rejected', NULL
      ),
      NULL
    ) AS cancellation,
    JSON_OBJECT('start', date_format(a.start,"%Y-%m-%d %T"), 'end', date_format(a.end,"%Y-%m-%d %T"), 'location', s.title) as event,
    u.members,
    p.title as projectTitle
  FROM
    booking b
    left join allotment a on a.id=b.allotment_id
    left join studio s on a.studio_id=s.id
    left join user_group u on b.group_id=u.id
    left join project p on u.projectId=p.id
    where (cancel_request=1 AND cancelled_approval is null AND cancelled_denial is null)
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

export const getManyPendingAdminApproval: EC = (_, res, next) =>
  pool.query(adminRequestQuery, addResultsToResponse(res, next));

export const adminResponse: EC = (req, res, next) => {
  const { approved, denied, adminId } = req.body;
  pool.query(
    `UPDATE booking
        SET cancelled_approval = ?,cancelled_denial = ?
        WHERE id = ?`,
    [
      approved ? adminId : null,
      denied ? adminId : null,
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
  getManyPendingAdminApproval,
  adminResponse,
  reserveEquipment: [reserveEquipment, deleteEquipmentReservationZeros],
};

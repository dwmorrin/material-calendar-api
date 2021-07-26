import { addResultsToResponse, controllers } from "../../utils/crud";
import pool from "../../utils/db";
import { EC } from "../../utils/types";

const query = `
SELECT
    b.id,
    b.purpose AS description,
    b.allotment_id AS eventId,
    b.group_id AS groupId,
    IFNULL (b.project_id, 0) AS projectId,
    b.guests,
    IF(
      b.cancelled = 1,
      if(b.refund_request = 1,
      JSON_OBJECT(
        'canceled', JSON_OBJECT(
          'on', date_format(b.cancelled_time,"%Y-%m-%d %T"),
          'by', b.cancelled_user_id,
          'comment', b.refund_request_comment
      ),
      'refund',JSON_OBJECT(
      'approved', JSON_OBJECT(
        'on', if(b.refund_approval is not null,date_format(refund_response_time,"%Y-%m-%d %T"),""),
        'by', refund_approval
      ),
        'rejected', JSON_OBJECT(
          'on', if(refund_denial is not null,date_format(refund_response_time,"%Y-%m-%d %T"),""),
          'by', refund_denial
        ))
      ),
      JSON_OBJECT(
        'canceled', JSON_OBJECT(
          'on', date_format(b.cancelled_time,"%Y-%m-%d %T"),
          'by', b.cancelled_user_id,
          'comment', b.refund_request_comment
      )
      )),
      NULL
    ) AS cancellation
  FROM
    booking b
    left join allotment a on a.id=b.allotment_id
    left join studio s on a.studio_id=s.id
    left join user_group u on b.group_id=u.id
    left join project p on u.projectId=p.id;
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
      b.cancelled = 1,
      if(b.refund_request = 1,
      JSON_OBJECT(
        'canceled', JSON_OBJECT(
          'on', date_format(b.cancelled_time,"%Y-%m-%d %T"),
          'by', b.cancelled_user_id,
          'comment', b.refund_request_comment
      ),
      'refund',JSON_OBJECT(
      'approved', JSON_OBJECT(
        'on', if(b.refund_approval is not null,date_format(refund_response_time,"%Y-%m-%d %T"),""),
        'by', refund_approval
      ),
        'rejected', JSON_OBJECT(
          'on', if(refund_denial is not null,date_format(refund_response_time,"%Y-%m-%d %T"),""),
          'by', refund_denial
        ))
      ),
      JSON_OBJECT(
        'canceled', JSON_OBJECT(
          'on', date_format(b.cancelled_time,"%Y-%m-%d %T"),
          'by', b.cancelled_user_id,
          'comment', b.refund_request_comment
      )
      )),
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
    where (refund_request=1 AND refund_approval is null AND refund_denial is null)
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

export const cancelReservation: EC = (req, res, next) =>
  pool.query(
    `UPDATE booking SET cancelled=1,cancelled_time=CURRENT_TIMESTAMP,
    cancelled_user_id=?,refund_request=?,refund_request_comment=?, 
    refund_approved=?, refund_response_time=? 
    WHERE id = ?`,
    [
      req.body.userId,
      req.body.refundRequest,
      req.body.refundApproved
        ? '"Refund Granted Automatically"'
        : req.body.refundComment,
      req.body.refundApproved ? req.body.userId : null,
      req.body.refundApproved ? "DEFAULT_TIMESTAMP" : null,
      req.params.id,
    ],
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
        SET refund_approval = ?,refund_denial = ?
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
        live_room: req.body.liveRoom,
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

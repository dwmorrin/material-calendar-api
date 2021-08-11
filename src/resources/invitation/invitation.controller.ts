import pool, { inflate } from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import { EC } from "../../utils/types";
import { useMailbox } from "../../utils/mailer";

export const getInvitationsQuery = `
SELECT
  inv.id AS id,
  inv.project_id AS projectId,
  JSON_OBJECT(
    'id', inv.invitor,
    'name', JSON_OBJECT('first', uin.first_name, 'last', uin.last_name),
    'email',uin.email
  ) AS invitor,
  IFNULL(tv.invitee,'[]') AS invitees,
  (
    SELECT (CASE WHEN COUNT(iv.accepted)=SUM(iv.accepted) THEN 1 ELSE 0 END)
  ) AS confirmed,
  rm.id AS group_id,
  inv.approved_id AS approvedId,
  inv.denied_id AS deniedId
FROM invitation inv
  LEFT JOIN invitee iv ON inv.id=iv.invitation_id 
  LEFT JOIN (
    SELECT
      vt.invitation_id AS invitation_id,
      JSON_ARRAYAGG(JSON_OBJECT(
        'id', vt.invitee,
        'name', JSON_OBJECT('first', uiv.first_name, 'last', uiv.last_name),
        'email',uiv.email,
        'accepted', vt.accepted,
        'rejected',vt.rejected
      )) AS invitee 
    FROM invitee vt 
    LEFT JOIN user uiv ON uiv.id=vt.invitee 
    GROUP BY vt.invitation_id
  ) tv ON tv.invitation_id=inv.id
  LEFT JOIN user uin ON uin.id=inv.invitor
  LEFT JOIN project_group rm on uin.id=rm.creator and inv.project_id=rm.project_id
WHERE (iv.invitee=? or inv.invitor=?)
GROUP BY inv.id`;

export const getInvitations: EC = (req, res, next) =>
  pool.query(
    getInvitationsQuery,
    [req.params.userId, req.params.userId],
    addResultsToResponse(res, next)
  );

export const getInvitationsByProject: EC = (req, res, next) =>
  pool.query(
    `select inv.id as id,
    inv.project_id as projectId,
    JSON_OBJECT('id',
           inv.invitor,
           'name',
           JSON_OBJECT('first',
            uin.first_name,
            'last',
            uin.last_name),'email',uin.email) as invitor,
            IFNULL(tv.invitee,'[]') AS invitees,
            (SELECT (CASE WHEN COUNT(iv.accepted)=SUM(iv.accepted) THEN 1 ELSE 0 END)) as confirmed,
            rm.id as group_id,
            inv.approved_id as approvedId,
            inv.denied_id as deniedId
            from invitation inv left join invitee iv on inv.id=iv.invitation_id 
            left join 
              (select vt.invitation_id as invitation_id, json_arrayagg(JSON_Object('id',
              vt.invitee,
              'name',
              JSON_OBJECT('first',
              uiv.first_name,
              'last',
              uiv.last_name),
              'email',uiv.email,
              'accepted',
              vt.accepted,'rejected',vt.rejected)) AS invitee 
              from invitee vt 
              left join user uiv on uiv.id=vt.invitee 
              group by vt.invitation_id) tv on tv.invitation_id=inv.id
            left join user uin on uin.id=inv.invitor
            left join project_group rm on uin.id=rm.creator and inv.project_id=rm.project_id
            where inv.project_id=? and (iv.invitee=? or inv.invitor=?) group by inv.id;`,
    [req.params.projectId, req.params.userId, req.params.userId],
    addResultsToResponse(res, next)
  );

export const getInvitationsPendingAdminApproval: EC = (req, res, next) =>
  pool.query(
    `select inv.id as id,
    inv.project_id as projectId,
    JSON_OBJECT('id',
           inv.invitor,
           'name',
           JSON_OBJECT('first',
            uin.first_name,
            'last',
            uin.last_name),'email',uin.email) as invitor,
            IFNULL(tv.invitee,'[]') AS invitees,
            (SELECT (CASE WHEN COUNT(iv.accepted)=SUM(iv.accepted) THEN 1 ELSE 0 END)) as confirmed,
            rm.id as group_id,
            inv.approved_id as approvedId,
            inv.denied_id as deniedId,
            p.title as projectTitle,
            p.group_size as projectGroupSize
            from invitation inv left join invitee iv on inv.id=iv.invitation_id 
            left join 
              (select vt.invitation_id as invitation_id, json_arrayagg(JSON_Object('id',
              vt.invitee,
              'name',
              JSON_OBJECT('first',
              uiv.first_name,
              'last',
              uiv.last_name),
              'email',uiv.email,
              'accepted',
              vt.accepted,'rejected',vt.rejected)) AS invitee 
              from invitee vt 
              left join user uiv on uiv.id=vt.invitee 
              group by vt.invitation_id) tv on tv.invitation_id=inv.id
            left join user uin on uin.id=inv.invitor
            left join project_group rm on uin.id=rm.creator and inv.project_id=rm.project_id
            left join project p on inv.project_id=p.id
            where (approved_id is null and denied_id is null) group by inv.id;`,
    addResultsToResponse(res, next)
  );

const createInvitations: EC = (req, res, next) => {
  const { mail } = req.body;
  // checks if 'to' is empty string; useMailbox requires mailbox be an array
  res.locals.mailbox = mail.to ? [mail] : [];
  pool.query(
    `insert into invitation (project_id,invitor,approved_id) VALUES (?,?,?)`,
    [
      req.body.projectId,
      req.body.invitorId,
      req.body.approved ? req.body.invitorId : null,
    ],
    addResultsToResponse(res, next)
  );
};

const createInvitees: EC = (req, res, next) => {
  const { results } = res.locals;
  const { invitees } = req.body;
  if (invitees.length > 0) {
    pool.query(
      `replace into invitee (invitation_id,invitee) VALUES ?`,
      [(invitees as number[]).map((invitee) => [results.insertId, invitee])],
      addResultsToResponse(res, next)
    );
  } else pool.query(`select '[]'`, addResultsToResponse(res, next));
};

const getUpdatedInvites: EC = (req, res, next) => {
  pool.query(
    getInvitationsQuery,
    [res.locals.user.id],
    addResultsToResponse(res, next)
  );
};

const createInvitesResponse: EC = (req, res, next) => {
  res.status(201).json({
    data: res.locals.results.map(inflate),
    context: req.query.context,
  });
  next(); // continues to useMailbox
};

export const updateInvitation: EC = (req, res, next) => {
  const { accepted, rejected, userId } = req.body;
  // Delete the Invitations that the accepting user has created
  if (accepted)
    pool.query(
      `delete i from invitation i where invitor=? AND project_id IN (
        SELECT pid FROM (
            SELECT DISTINCT invitation.project_id AS pid FROM invitation where id=?
        ) AS inv
    )`,
      [userId, req.params.invitationId]
    );
  pool.query(
    `UPDATE invitee
      SET accepted = ?, rejected = ?
      WHERE invitation_id = ? and invitee = ?`,
    [accepted ? 1 : 0, rejected ? 1 : 0, req.params.invitationId, userId],
    addResultsToResponse(res, next)
  );
};

export const adminResponse: EC = (req, res, next) => {
  const { approved, denied, adminId } = req.body;
  pool.query(
    `UPDATE invitation
      SET approved_id = ?,denied_id = ?
      WHERE id = ?`,
    [
      approved ? adminId : null,
      denied ? adminId : null,
      req.params.invitationId,
    ],
    addResultsToResponse(res, next)
  );
};

export const removeInvitation: EC = (req, res, next) =>
  pool.query(
    `delete from invitation where id=?`,
    [req.params.invitationId],
    addResultsToResponse(res, next)
  );

export default {
  getInvitations,
  getInvitationsByProject,
  getInvitationsPendingAdminApproval,
  adminResponse,
  createInvitations: [
    createInvitations,
    createInvitees,
    getUpdatedInvites,
    createInvitesResponse, // response sent here
    useMailbox,
    (): void => undefined, // to stop after mailbox
  ],
  updateInvitation,
  removeInvitation,
};

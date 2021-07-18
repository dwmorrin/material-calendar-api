import pool from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import { EC } from "../../utils/types";

export const getInvitations: EC = (req, res, next) =>
  pool.query(
    `select inv.id as id,
    inv.project_id as project,
    JSON_OBJECT('id',
           inv.invitor,
           'name',
           JSON_OBJECT('first',
            uin.first_name,
            'last',
            uin.last_name)) as invitor,
            tv.invitee AS invitees,
            tv.invitation_id AS insssvitees,
            (SELECT (CASE WHEN COUNT(iv.accepted)=SUM(iv.accepted) THEN 1 ELSE 0 END)) as confirmed,
            rm.id as group_id
            from invitation inv left join invitee iv on inv.id=iv.invitation_id 
            left join 
              (select vt.invitation_id as invitation_id, json_arrayagg(JSON_Object('id',
              vt.invitee,
              'name',
              JSON_OBJECT('first',
              uiv.first_name,
              'last',
              uiv.last_name),
              'accepted',
              vt.accepted,'rejected',vt.rejected)) AS invitee 
              from invitee vt 
              left join user uiv on uiv.id=vt.invitee 
              group by vt.invitation_id) tv on tv.invitation_id=inv.id
            left join user uin on uin.id=inv.invitor
            left join rm_group rm on uin.id=rm.creator and inv.project_id=rm.project_id
            where (iv.invitee=? or inv.invitor=?) group by inv.id;`,
    [req.params.userId, req.params.userId],
    addResultsToResponse(res, next)
  );

export const getInvitationsByProject: EC = (req, res, next) =>
  pool.query(
    `select inv.id as id,
    inv.project_id as project,
    JSON_OBJECT('id',
           inv.invitor,
           'name',
           JSON_OBJECT('first',
            uin.first_name,
            'last',
            uin.last_name)) as invitor,
            tv.invitee AS invitees,
            tv.invitation_id AS insssvitees,
            (SELECT (CASE WHEN COUNT(iv.accepted)=SUM(iv.accepted) THEN 1 ELSE 0 END)) as confirmed,
            rm.id as group_id
            from invitation inv left join invitee iv on inv.id=iv.invitation_id 
            left join 
              (select vt.invitation_id as invitation_id, json_arrayagg(JSON_Object('id',
              vt.invitee,
              'name',
              JSON_OBJECT('first',
              uiv.first_name,
              'last',
              uiv.last_name),
              'accepted',
              vt.accepted,'rejected',vt.rejected)) AS invitee 
              from invitee vt 
              left join user uiv on uiv.id=vt.invitee 
              group by vt.invitation_id) tv on tv.invitation_id=inv.id
            left join user uin on uin.id=inv.invitor
            left join rm_group rm on uin.id=rm.creator and inv.project_id=rm.project_id
            where inv.project_id=? and (iv.invitee=? or inv.invitor=?) group by inv.id;`,
    [req.params.projectId, req.params.userId, req.params.userId],
    addResultsToResponse(res, next)
  );

const createInvitations: EC = (req, res, next) =>
  pool.query(
    `insert into invitation (project_id,invitor) VALUES (?,?)`,
    [req.body.projectId, req.body.invitorId],
    addResultsToResponse(res, next)
  );

const createInvitees: EC = (req, res, next) => {
  const { results } = res.locals;
  const { invitees } = req.body;
  pool.query(
    `replace into invitee (invitation_id,invitee) VALUES ?`,
    [(invitees as unknown[]).map((invitee) => [results.insertId, invitee])],
    addResultsToResponse(res, next)
  );
};

export const updateInvitation: EC = (req, res, next) => {
  const { accepted, rejected, userId } = req.body;
  pool.query(
    `UPDATE invitee
      SET accepted = ?, rejected = ?
      WHERE invitation_id = ? and invitee = ?`,
    [accepted ? 1 : 0, rejected ? 1 : 0, req.params.invitationId, userId],
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
  createInvitations: [createInvitations, createInvitees],
  updateInvitation,
  removeInvitation,
};

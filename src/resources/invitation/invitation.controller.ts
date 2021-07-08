import { Request, Response } from "express";
import pool, { error500, inflate, mapKeysToBool } from "../../utils/db";
import { onResult } from "../../utils/crud";
import { MysqlError, Query } from "mysql";

const makeOpenBool = mapKeysToBool("open");
const inflateAndOpenBool = (data: Record<string, unknown>) =>
  inflate(makeOpenBool(data));

export const getInvitations = (req: Request, res: Response): Query =>
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
    onResult({ req, res, dataMapFn: inflateAndOpenBool }).read
  );

export const getInvitationsByProject = (req: Request, res: Response): Query =>
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
    onResult({ req, res, dataMapFn: inflateAndOpenBool }).read
  );

export const createInvitations = (req: Request, res: Response): void => {
  pool.query(
    `insert into invitation (project_id,invitor) VALUES (?,?)`,
    [req.body.projectId, req.body.invitorId],
    (error, results) => {
      if (error) return onError(error);
      pool.query(
        `replace into invitee (invitation_id,invitee) VALUES ?`,
        [createInvitees(results.insertId, req.body.invitees)],
        onResult({ req, res }).update
      );
    }
  );
  function onError(error: MysqlError) {
    res.status(500).json(error500(error, req.query.context));
  }
  function createInvitees(invitationId: number, invitees: []) {
    return invitees.map((invitee) => [invitationId, invitee]);
  }
};

export const updateInvitation = (req: Request, res: Response): void => {
  if (req.body.rejected) {
    pool.query(
      `update invitee set accepted=0, rejected=1 where invitation_id=? and invitee=?`,
      [req.params.invitationId, req.body.userId],
      onResult({ req, res, dataMapFn: inflateAndOpenBool }).update
    );
  }
  if (req.body.accepted) {
    pool.query(
      `update invitee set accepted=1, rejected=0 where invitation_id=? and invitee=?`,
      [req.params.invitationId, req.body.userId],
      onResult({ req, res, dataMapFn: inflateAndOpenBool }).update
    );
  }
};

export const removeInvitation = (req: Request, res: Response): Query =>
  pool.query(
    `delete from invitation where id=?`,
    [req.params.invitationId],
    onResult({ req, res }).delete
  );

export default {
  getInvitations,
  getInvitationsByProject,
  createInvitations,
  updateInvitation,
  removeInvitation,
};

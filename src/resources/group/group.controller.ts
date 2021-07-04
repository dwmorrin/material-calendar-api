import { Request, Response } from "express";
import pool, { inflate } from "../../utils/db";
import { onResult } from "../../utils/crud";
import { groupQueryFn } from "./group.query";
import { Query } from "mysql";

export const getGroups = (req: Request, res: Response): Query =>
  pool.query(groupQueryFn(), onResult({ req, res, dataMapFn: inflate }).read);

export const getOneGroup = (req: Request, res: Response): Query =>
  pool.query(
    groupQueryFn("WHERE g.id = ?"),
    [req.params.groupId],
    onResult({ req, res, dataMapFn: inflate, take: 1 }).read
  );

export const getGroupsByUser = (req: Request, res: Response): Query =>
  pool.query(
    groupQueryFn("WHERE JSON_SEARCH(g.members, 'all', ?)"),
    [req.params.userId],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const getGroupsByProject = (req: Request, res: Response): Query =>
  pool.query(
    groupQueryFn("WHERE g.projectId = ?"),
    [req.params.projectId],
    onResult({ req, res, dataMapFn: inflate }).read
  );

export const removeOneGroup = (req: Request, res: Response): Query =>
  pool.query(
    "DELETE FROM rm_group WHERE id=?",
    [req.params.groupId],
    onResult({ req, res }).delete
  );

export const createGroupFromInvitation = (req: Request, res: Response): Query =>
  pool.query(
    "insert into rm_group (project_id, course_id, creator, status, group_type, group_size) select invitation.project_id,course.id,invitation.invitor as creator,1 as status,1 as group_type,count(invitee.accepted)+1 as group_size from invitation left join invitee on invitation.id=invitee.invitation_id left join project on invitation.project_id=project.id left join course_project on project.id=course_project.project_id left join course on course_project.course_id=course.id left join user on invitation.invitor=user.id where invitation.id=?",
    [req.params.invitationId],
    onResult({ req, res }).create
  );

export const joinGroup = (req: Request, res: Response): Query =>
  pool.query(
    "replace into student_group (SELECT invitee.invitee as student_id, ? as group_id FROM invitee left join invitation on invitation.id=invitee.invitation_id where invitation_id=? and invitee.accepted=1 UNION DISTINCT SELECT invitation.invitor AS student_id, ? as group_id FROM invitation where invitation.id=?)",
    [
      req.params.groupId,
      req.params.invitationId,
      req.params.groupId,
      req.params.invitationId,
    ],
    onResult({ req, res }).create
  );

export const leaveGroup = (req: Request, res: Response): Query =>
  pool.query(
    "DELETE FROM student_group WHERE student_id=? AND group_id=?",
    [req.params.groupId, req.params.groupId],
    onResult({ req, res }).delete
  );

export default {
  getGroups,
  getGroupsByUser,
  getGroupsByProject,
  getOneGroup,
  createGroupFromInvitation,
  removeOneGroup,
  joinGroup,
  leaveGroup,
};

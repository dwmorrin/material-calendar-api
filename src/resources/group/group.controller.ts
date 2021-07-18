import pool from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import { groupQueryFn } from "./group.query";
import { EC } from "../../utils/types";

export const getGroups: EC = (_, res, next) =>
  pool.query(groupQueryFn(), addResultsToResponse(res, next));

export const getOneGroup: EC = (req, res, next) =>
  pool.query(
    groupQueryFn("WHERE g.id = ?"),
    [req.params.groupId],
    addResultsToResponse(res, next, { one: true })
  );

export const getGroupsByUser: EC = (req, res, next) =>
  pool.query(
    groupQueryFn("WHERE JSON_SEARCH(g.members, 'all', ?)"),
    [req.params.userId],
    addResultsToResponse(res, next)
  );

export const getGroupsByProject: EC = (req, res, next) =>
  pool.query(
    groupQueryFn("WHERE g.projectId = ?"),
    [req.params.projectId],
    addResultsToResponse(res, next)
  );

export const removeOneGroup: EC = (req, res, next) =>
  pool.query(
    "DELETE FROM rm_group WHERE id=?",
    [req.params.groupId],
    addResultsToResponse(res, next)
  );

export const createGroupFromInvitation: EC = (req, res, next) =>
  pool.query(
    `INSERT INTO rm_group (
      project_id, course_id, creator, status, group_type, group_size
    )
    SELECT
      invitation.project_id,
      course.id,
      invitation.invitor as creator,
      1 as status,
      1 as group_type,
      count(invitee.accepted)+1 as group_size
    FROM invitation
      INNER JOIN invitee ON invitation.id = invitee.invitation_id
      INNER JOIN project ON invitation.project_id = project.id
      INNER JOIN section_project ON project.id = section_project.project_id
      INNER JOIN section ON section_project.section_id = section.id
      INNER JOIN course ON section.course_id = course.id
      INNER JOIN user ON invitation.invitor = user.id
    WHERE invitation.id = ?`,
    [req.params.invitationId],
    addResultsToResponse(res, next)
  );

export const joinGroup: EC = (req, res, next) =>
  pool.query(
    `REPLACE INTO student_group (
      SELECT
        invitee.invitee AS student_id,
        ? AS group_id
      FROM invitee
        LEFT JOIN invitation ON invitation.id = invitee.invitation_id
      WHERE
        invitation_id = ? AND invitee.accepted = 1
      UNION DISTINCT SELECT
        invitation.invitor AS student_id,
        ? AS group_id
      FROM invitation where invitation.id = ?
    )`,
    [
      req.params.groupId,
      req.params.invitationId,
      req.params.groupId,
      req.params.invitationId,
    ],
    addResultsToResponse(res, next)
  );

export const leaveGroup: EC = (req, res, next) =>
  pool.query(
    "DELETE FROM student_group WHERE student_id=? AND group_id=?",
    [req.params.userId, req.params.groupId],
    addResultsToResponse(res, next)
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

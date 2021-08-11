import pool from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import { EC } from "../../utils/types";
import { useMailbox } from "../../utils/mailer";

/**
 * Reading: use the `user_group` view.
 * Writing: use the `project_group` table.
 */

export const getGroups: EC = (_, res, next) =>
  pool.query("SELECT * FROM user_group", addResultsToResponse(res, next));

export const getOneGroup: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM user_group WHERE id = ?",
    [req.params.groupId],
    addResultsToResponse(res, next, { one: true })
  );

export const getGroupsByUser: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM user_group WHERE JSON_CONTAINS(members, JSON_OBJECT('id', ?))",
    [Number(req.params.userId)],
    addResultsToResponse(res, next)
  );

export const getGroupsByProject: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM user_group WHERE projectId = ?",
    [req.params.projectId],
    addResultsToResponse(res, next)
  );

export const removeOneGroup: EC = (req, res, next) =>
  pool.query(
    "DELETE FROM project_group WHERE id=?",
    [req.params.groupId],
    addResultsToResponse(res, next)
  );

export const createGroupFromInvitation: EC = (req, res, next) =>
  pool.query(
    `INSERT INTO project_group (
      project_id, course_id, creator
    )
    SELECT
      invitation.project_id,
      course.id as course_id,
      invitation.invitor as creator
    FROM invitation
      INNER JOIN project ON invitation.project_id = project.id
      INNER JOIN section_project ON project.id = section_project.project_id
      INNER JOIN section ON section_project.section_id = section.id
      INNER JOIN course ON section.course_id = course.id
    WHERE invitation.id = ? limit 1`,
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

const leaveGroup: EC = (req, res, next) => {
  const { mail } = req.body;
  res.locals.mailbox = mail.to ? [mail] : [];
  pool.query(
    "DELETE FROM student_group WHERE student_id=? AND group_id=?",
    [req.params.userId, req.params.groupId],
    addResultsToResponse(res, next)
  );
};

const rejectAllGroupInvites: EC = (req, res, next) => {
  const { projectId } = req.body;
  pool.query(
    `UPDATE invitee
      SET accepted = 0, rejected = 1
      WHERE invitation_id = (
        SELECT id FROM invitation WHERE project_id = ?
      ) and invitee = ?`,
    [projectId, res.locals.user.id],
    addResultsToResponse(res, next, { key: "ignore" })
  );
};

const deleteEmptyGroup: EC = (req, res, next) => {
  const { groupIsEmpty } = req.body;
  if (!groupIsEmpty) return next();
  pool.query(
    "DELETE FROM project_group WHERE id=?",
    [req.params.groupId],
    addResultsToResponse(res, next)
  );
};

//! TODO we need to update groups and invitations
const leaveResponse: EC = (_, res, next) => {
  res.status(201).json({ data: "left group" });
  next();
};

const updateOne: EC = (req, res, next) => {
  const { projectId, title } = req.body;
  pool.query(
    "UPDATE project_group SET ? WHERE id = ?",
    [{ project_id: projectId, name: title }, req.params.groupId],
    addResultsToResponse(res, next, { one: true })
  );
};

export default {
  getGroups,
  getGroupsByUser,
  getGroupsByProject,
  getOneGroup,
  createGroupFromInvitation,
  removeOneGroup,
  joinGroup,
  leaveGroup: [
    leaveGroup,
    rejectAllGroupInvites,
    deleteEmptyGroup,
    leaveResponse,
    useMailbox,
    (): void => undefined,
  ],
  updateOne,
};

import pool, { inflate } from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import { EC } from "../../utils/types";
import { useMailbox } from "../../utils/mailer";
import { getUpdatedInvites } from "../invitation/invitation.controller";

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

const getGroupsByUserQuery =
  "SELECT * FROM user_group WHERE JSON_CONTAINS(members, JSON_OBJECT('id', ?))";

export const getGroupsByUser: EC = (req, res, next) =>
  pool.query(
    getGroupsByUserQuery,
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

// surely we can refactor to share code, but this is just to update after leaving a group
const getUpdatedGroups: EC = (_, res, next) => {
  pool.query(
    getGroupsByUserQuery,
    [res.locals.user.id],
    addResultsToResponse(res, next, { key: "groups" })
  );
};

const leaveResponse: EC = (req, res, next) => {
  const { invitations, groups } = res.locals;
  res.status(201).json({
    data: {
      invitations: invitations.map(inflate),
      groups: groups.map(inflate),
    },
    context: req.query.context,
  });
  next();
};

const updateOne: EC = (req, res, next) => {
  const { projectId, title } = req.body;
  pool.query(
    "UPDATE project_group SET ? WHERE id = ?",
    [{ project_id: projectId, title }, req.params.groupId],
    addResultsToResponse(res, next, { one: true })
  );
};

export default {
  getGroups,
  getGroupsByUser,
  getGroupsByProject,
  getOneGroup,
  removeOneGroup,
  joinGroup,
  leaveGroup: [
    leaveGroup,
    rejectAllGroupInvites,
    deleteEmptyGroup,
    getUpdatedGroups,
    getUpdatedInvites,
    leaveResponse,
    useMailbox,
    (): void => undefined,
  ],
  updateOne,
};

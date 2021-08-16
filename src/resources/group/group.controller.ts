import { Connection } from "mysql";
import pool, {
  startTransaction,
  endTransaction,
  inflate,
} from "../../utils/db";
import { addResultsToResponse } from "../../utils/crud";
import { EC } from "../../utils/types";
import { useMailbox } from "../../utils/mailer";
import { getUpdatedInvites } from "../invitation/invitation.controller";

/**
 * Reading: use the `project_group_view` view.
 * Writing: use the `project_group` table.
 */

export const getGroups: EC = (_, res, next) =>
  pool.query(
    "SELECT * FROM project_group_view",
    addResultsToResponse(res, next)
  );

export const getOneGroup: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM project_group_view WHERE id = ?",
    [req.params.groupId],
    addResultsToResponse(res, next, { one: true })
  );

const getGroupsByUserQuery =
  "SELECT * FROM project_group_view WHERE JSON_CONTAINS(members, JSON_OBJECT('id', ?))";

export const getGroupsByUser: EC = (req, res, next) =>
  pool.query(
    getGroupsByUserQuery,
    [Number(req.params.userId)],
    addResultsToResponse(res, next)
  );

export const getGroupsByProject: EC = (req, res, next) =>
  pool.query(
    "SELECT * FROM project_group_view WHERE projectId = ?",
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
export const getUpdatedGroups: EC = (_, res, next) => {
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

interface UserGroupRecord {
  id?: number;
  title: string;
  project_id: number;
  creator_id: number;
  admin_created_id?: number;
  admin_approved_id?: number;
  admin_rejected_id?: number;
  pending: boolean;
  abandoned: boolean;
}

interface CreateGroupRequest {
  title: string;
  projectId: number;
  members: number[];
  approved: boolean;
  mail: {
    to: string;
    subject: string;
    text: string;
  };
}

const getProjectGroupSize: EC = (req, res, next) => {
  const request: CreateGroupRequest = req.body;
  const { projectId } = request;
  pool.query(
    "SELECT group_size FROM project WHERE id = ?",
    projectId,
    (err, result) => {
      if (err) return next(err);
      const groupSize = result[0].group_size;
      if (!(typeof groupSize === "number"))
        return next(new Error("Invalid group size"));
      res.locals.groupSize = groupSize;
      next();
    }
  );
};

const createPendingGroup: EC = (req, res, next) => {
  const request: CreateGroupRequest = req.body;
  const groupSize: number = res.locals.groupSize;
  // assuming that only group size === 1 can be auto-approved
  const pending = !(
    groupSize === 1 &&
    request.members.length === 1 &&
    request.approved
  );
  const userGroup: UserGroupRecord = {
    title: request.title,
    project_id: request.projectId,
    creator_id: res.locals.user.id,
    admin_created_id: res.locals.admin ? res.locals.user.id : null,
    pending,
    abandoned: false,
  };
  pool.query(
    "INSERT INTO project_group SET ?",
    userGroup,
    addResultsToResponse(res, next, { key: "group" })
  );
};

const createPendingGroupMembers: EC = (req, res, next) => {
  const request: CreateGroupRequest = req.body;
  const groupId: number = res.locals.group.insertId;
  if (!groupId) next("no group ID after insert");
  const members: number[] = request.members;
  if (!Array.isArray(members) || !members.length) next("no members");
  pool.query(
    "REPLACE INTO project_group_user (user_id, project_group_id) VALUES ?",
    [members.map((id) => [id, groupId])],
    addResultsToResponse(res, next, { key: "ignore" })
  );
};

const acceptOwnInvitation: EC = (_, res, next) => {
  const groupId: number = res.locals.group.insertId;
  pool.query(
    `UPDATE project_group_user SET
       invitation_accepted = TRUE
     WHERE user_id = ? AND project_group_id = ?`,
    [res.locals.user.id, groupId],
    addResultsToResponse(res, next, { key: "ignore" })
  );
};

const createResponse: EC = (req, res) => {
  const { invitations, groups } = res.locals;
  res.status(201).json({
    data: {
      invitations: invitations.map(inflate),
      groups: groups.map(inflate),
    },
    context: req.query.context,
  });
};

// using transaction
const cancelInvite: EC = (req, res, next) => {
  const connection: Connection = res.locals.connection;
  const groupId = Number(req.params.groupId);
  if (isNaN(groupId)) return next("invalid group ID");
  const userId: number = res.locals.user.id;
  connection.query(
    [
      "UPDATE project_group_user SET invitation_rejected = TRUE",
      "WHERE project_group_id = ? AND user_id = ?;",
      "UPDATE project_group SET abandoned = TRUE",
      "WHERE id = ?",
    ].join(" "),
    [groupId, userId, groupId],
    addResultsToResponse(res, next)
  );
};

const cancelInviteResponse: EC = (req, res, next) => {
  const groups: unknown[] = res.locals.groups;
  if (!Array.isArray(groups))
    return next("no groups in cancel invite response");
  res.status(201).json({
    data: {
      groups: groups.map(inflate),
    },
    context: req.query.context,
  });
};

const createGroup = [
  getProjectGroupSize,
  createPendingGroup,
  createPendingGroupMembers,
  acceptOwnInvitation,
  getUpdatedGroups,
  getUpdatedInvites,
  createResponse,
];

export default {
  createOne: createGroup,
  cancelInvite: [
    ...startTransaction,
    cancelInvite,
    ...endTransaction,
    getUpdatedGroups,
    cancelInviteResponse,
    useMailbox,
  ],
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
  ],
  updateOne,
};

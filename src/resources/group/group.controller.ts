import { Connection } from "mysql";
import pool, {
  startTransaction,
  endTransaction,
  inflate,
} from "../../utils/db";
import { addResultsToResponse, $ } from "../../utils/crud";
import { EC } from "../../utils/types";
import { useMailbox } from "../../utils/mailer";
import { UserGroup, UserGroupRecord, CreateGroupRequest } from "./types";

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
    "UPDATE project_group SET abandoned = TRUE WHERE id = ?",
    [req.params.groupId],
    addResultsToResponse(res, next)
  );

export const getUpdatedGroups = $(
  getGroupsByUserQuery,
  (_, res) => res.locals.user.id,
  "groups"
);

const leaveResponse: EC = (req, res, next) => {
  const groups: UserGroup[] = res.locals.groups;
  res.status(201).json({
    data: {
      groups: groups.map(inflate),
    },
    context: req.query.context,
  });
  next();
};

// TODO this one needs to be updated to use the new group model
const updateOne: EC = (req, res, next) => {
  const { projectId, title } = req.body;
  pool.query(
    "UPDATE project_group SET ? WHERE id = ?",
    [{ project_id: projectId, title }, req.params.groupId],
    addResultsToResponse(res, next, { one: true })
  );
};

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
  const members: number[] = request.members;
  if (!Array.isArray(members) || !members.length) next("no group members");
  res.locals.members = members.map((id) => [id, res.locals.group.insertId]);
  // assuming that only group size === 1 can be auto-approved
  const pending = !(
    groupSize === 1 &&
    members.length === 1 &&
    request.approved
  );
  const userGroup: UserGroupRecord = {
    title: request.title,
    project_id: request.projectId,
    creator_id: res.locals.user.id,
    admin_created_id: res.locals.admin ? res.locals.user.id : null,
    pending,
  };
  pool.query(
    "INSERT INTO project_group SET ?",
    userGroup,
    addResultsToResponse(res, next, { key: "group" })
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

/**
 * Group invitees can accept or reject the invite.
 * On reject, the group is marked as abandoned.
 * On accept, the group can be auto-approved (pending = false) if
 *   * no existing exceptions or all exceptions have admin approval
 *   * all invitees have accepted
 * Otherwise, the group remains pending.
 */
const updateInvite: EC = (req, res, next) => {
  const update: { accepted?: boolean; rejected?: boolean } = req.body;
  const currentGroup: UserGroup = res.locals.group;
  if (!currentGroup.pending) return next("cannot update settled group");
  const connection: Connection = res.locals.connection;
  const userId: number = res.locals.user.id;
  if (update.rejected) {
    connection.query(
      [
        "UPDATE project_group SET abandoned = TRUE, pending = FALSE WHERE id = ?;",
        "UPDATE project_group_user SET invitation_rejected = TRUE",
        "WHERE project_group_id = ? AND user_id = ?",
      ].join(" "),
      [currentGroup.id, currentGroup.id, userId],
      addResultsToResponse(res, next)
    );
  } else if (update.accepted) {
    const query: string[] = [
      "UPDATE project_group_user SET accepted = TRUE",
      "WHERE project_group_id = ? user_id = ?;",
    ];
    const params: number[] = [currentGroup.id, userId];
    // check if all members have accepted
    const allAccepted = currentGroup.members
      .filter(({ id }) => id !== userId)
      .every(({ invitation }) => invitation.accepted && !invitation.rejected);
    if (!currentGroup.exceptionalSize && allAccepted) {
      query.push("UPDATE project_group SET pending = FALSE WHERE id = ?");
      params.push(currentGroup.id);
    }
    connection.query(query.join(" "), params, addResultsToResponse(res, next));
  } else {
    next("invite update was neither accepted or rejected");
  }
  next();
};

const updateInviteResponse: EC = (_, res, next) => {
  const groups: UserGroup[] = res.locals.groups;
  if (!Array.isArray(groups)) return next("no groups after update");
  return res.status(201).json({ data: { groups } });
};

export default {
  createOne: [
    getProjectGroupSize,
    createPendingGroup,
    $(
      "REPLACE INTO project_group_user (user_id, project_group_id) VALUES ?",
      (_, res) => [res.locals.members]
    ),
    $(
      `UPDATE project_group_user SET
       invitation_accepted = TRUE
     WHERE user_id = ? AND project_group_id = ?`,
      (_, res) => [res.locals.user.id, res.locals.group.insertId]
    ),
    getUpdatedGroups,
    createResponse,
  ],
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
  leaveGroup: [
    $(
      "UPDATE project_group SET abandoned = TRUE WHERE group_id = ?",
      (req) => req.params.groupId
    ),
    getUpdatedGroups,
    leaveResponse,
    useMailbox,
  ],
  updateInvite: [
    $(
      "SELECT * FROM project_group_view WHERE id = ?",
      (req) => Number(req.params.groupId),
      "group"
    ),
    ...startTransaction,
    updateInvite,
    ...endTransaction,
    $(getGroupsByUserQuery, (_, res) => res.locals.user.id, "groups"),
    updateInviteResponse,
    useMailbox,
  ],
  updateOne,
};
